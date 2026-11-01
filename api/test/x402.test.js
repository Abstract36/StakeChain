// The self-hosted payment path: nine refusals standing between a
// stranger's signature and the data. It is not what production runs today
// — the CDP facilitator is — but it is the fallback, and a fallback nobody
// has tested is not one you can fall back to.
//
// Each test builds a payment designed to defeat exactly one check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { createX402 } from "../x402.js";

const CHAIN = 8453;
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const PRICE = "1000";

const TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" }, { name: "to", type: "address" },
    { name: "value", type: "uint256" }, { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" },
  ],
};
const DOMAIN = { name: "USD Coin", version: "2", chainId: CHAIN, verifyingContract: USDC };

const tokenStub = ({ nonceUsed = false, settle } = {}) => ({
  name: async () => "USD Coin",
  version: async () => "2",
  authorizationState: async () => nonceUsed,
  transferWithAuthorization:
    settle ||
    (async () => ({ wait: async () => ({ transactionHash: "0x" + "ab".repeat(32) }) })),
});

const gate = (deps = {}) =>
  createX402(
    { chainId: CHAIN, network: "base", usdcAddress: USDC, payTo: PAY_TO,
      priceAtomic: PRICE, internalKey: "secret" },
    { usdc: tokenStub(deps), hasRelayer: deps.hasRelayer }
  );

const now = () => Math.floor(Date.now() / 1000);

async function paymentFrom(wallet, over = {}) {
  const a = {
    from: wallet.address, to: PAY_TO, value: PRICE,
    validAfter: "0", validBefore: String(now() + 300),
    nonce: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
    ...over,
  };
  const signature = await wallet._signTypedData(DOMAIN, TYPES, a);
  return { a, signature };
}

const encode = (a, signature) =>
  Buffer.from(JSON.stringify({ payload: { authorization: a, signature } })).toString("base64");

// Minimal express req/res doubles.
function exchange(headers = {}) {
  const res = {
    code: null, body: null, headers: {},
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
    set(k, v) { this.headers[k] = v; },
  };
  let passed = false;
  return {
    req: { header: (k) => headers[k], originalUrl: "/v1/best?asset=USDC" },
    res,
    next: () => { passed = true; },
    get passed() { return passed; },
  };
}

const refusal = async (gateFn, headers) => {
  const x = exchange(headers);
  await gateFn(x.req, x.res, x.next);
  assert.equal(x.passed, false, "a refused payment must not reach the handler");
  assert.equal(x.res.code, 402);
  return x.res.body;
};

test("no payment header: 402 with the terms attached", async () => {
  const body = await refusal(await gate(), {});
  assert.equal(body.error, "payment required");
  assert.equal(body.accepts[0].payTo, PAY_TO);
  assert.equal(body.accepts[0].maxAmountRequired, PRICE);
  assert.equal(body.accepts[0].asset, USDC);
  assert.equal(body.accepts[0].extra.name, "USD Coin", "the domain is read from the token itself");
});

test("a signature from another key cannot spend someone else's address", async () => {
  // The check everything else rests on: claim a wealthy `from`, sign with
  // a key you control.
  const victim = ethers.Wallet.createRandom();
  const attacker = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(attacker, { from: victim.address });
  const body = await refusal(await gate(), { "X-PAYMENT": encode(a, signature) });
  assert.equal(body.error, "bad signature");
});

test("tampering with the amount after signing invalidates the signature", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w);
  const body = await refusal(await gate(), {
    "X-PAYMENT": encode({ ...a, value: "1000000" }, signature),
  });
  assert.equal(body.error, "bad signature");
});

test("paying someone else is refused before the signature is even checked", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w, { to: ethers.Wallet.createRandom().address });
  const body = await refusal(await gate(), { "X-PAYMENT": encode(a, signature) });
  assert.equal(body.error, "wrong payTo");
});

test("underpaying is refused; overpaying is allowed", async () => {
  const w = ethers.Wallet.createRandom();
  const short = await paymentFrom(w, { value: "999" });
  assert.equal(
    (await refusal(await gate(), { "X-PAYMENT": encode(short.a, short.signature) })).error,
    "insufficient amount"
  );

  const over = await paymentFrom(w, { value: "5000" });
  const x = exchange({ "X-PAYMENT": encode(over.a, over.signature) });
  await (await gate())(x.req, x.res, x.next);
  assert.equal(x.passed, true, "a buyer paying more than asked is not an error");
});

test("an authorization not yet valid, or about to expire, is refused", async () => {
  const w = ethers.Wallet.createRandom();
  const future = await paymentFrom(w, { validAfter: String(now() + 600) });
  assert.equal(
    (await refusal(await gate(), { "X-PAYMENT": encode(future.a, future.signature) })).error,
    "not valid yet"
  );

  // Under the six-second floor the settlement could expire mid-flight.
  const expiring = await paymentFrom(w, { validBefore: String(now() + 3) });
  assert.equal(
    (await refusal(await gate(), { "X-PAYMENT": encode(expiring.a, expiring.signature) })).error,
    "authorization expiring"
  );
});

test("a nonce already spent on chain cannot be replayed", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w);
  const body = await refusal(await gate({ nonceUsed: true }), {
    "X-PAYMENT": encode(a, signature),
  });
  assert.equal(body.error, "nonce already used");
});

test("garbage in the header is a refusal, not a crash", async () => {
  for (const header of ["not-base64-at-all", Buffer.from("{}").toString("base64"),
                        Buffer.from('{"payload":{}}').toString("base64")]) {
    const x = exchange({ "X-PAYMENT": header });
    await (await gate())(x.req, x.res, x.next);
    assert.equal(x.passed, false);
    assert.equal(x.res.code, 402);
  }
});

test("without a relayer it refuses rather than serving unpaid", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w);
  const body = await refusal(await gate({ hasRelayer: false }), {
    "X-PAYMENT": encode(a, signature),
  });
  assert.match(body.error, /relayer not configured/);
});

test("a settlement that reverts does not let the request through", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w);
  const body = await refusal(
    await gate({ settle: async () => { throw new Error("execution reverted"); } }),
    { "X-PAYMENT": encode(a, signature) }
  );
  assert.match(body.error, /settlement failed/);
});

test("a good payment settles and the receipt names payer and transaction", async () => {
  const w = ethers.Wallet.createRandom();
  const { a, signature } = await paymentFrom(w);
  const x = exchange({ "X-PAYMENT": encode(a, signature) });
  await (await gate())(x.req, x.res, x.next);

  assert.equal(x.passed, true);
  const receipt = JSON.parse(
    Buffer.from(x.res.headers["X-PAYMENT-RESPONSE"], "base64").toString("utf8")
  );
  assert.equal(receipt.success, true);
  assert.equal(receipt.payer, w.address, "the receipt must name the signer, not the relayer");
  assert.match(receipt.transaction, /^0x[0-9a-f]{64}$/);
});

test("the internal key bypasses the gate and nothing else does", async () => {
  const ok = exchange({ "X-INTERNAL-KEY": "secret" });
  await (await gate())(ok.req, ok.res, ok.next);
  assert.equal(ok.passed, true);

  const wrong = exchange({ "X-INTERNAL-KEY": "guess" });
  await (await gate())(wrong.req, wrong.res, wrong.next);
  assert.equal(wrong.passed, false);
  assert.equal(wrong.res.code, 402);
});
