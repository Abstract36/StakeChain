// Paying x402 client, speaking both protocol versions.
//
// v1 put the requirements in the 402 body and the payment in X-PAYMENT.
// v2 puts the requirements in a base64 PAYMENT-REQUIRED header, names
// networks in CAIP-2 form, and expects the payment in PAYMENT-SIGNATURE.
// The signed material is the same EIP-3009 USDC authorization either way,
// so only the envelope differs — and handling both means the client keeps
// working across a server migration rather than breaking at the moment of
// the switch.
import { ethers } from "ethers";

const CHAIN_IDS = { base: 8453, "base-sepolia": 84532, arbitrum: 42161 };

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
const unb64 = (s) => JSON.parse(Buffer.from(s, "base64").toString("utf8"));

/** eip155:8453 -> 8453; "base" -> 8453 */
const chainIdOf = (network) =>
  String(network).startsWith("eip155:")
    ? Number(String(network).split(":")[1])
    : CHAIN_IDS[network] || 8453;

export async function payFetch(url, { pk, headers = {} } = {}) {
  const first = await fetch(url, { headers });
  if (first.status !== 402) return first;

  // v2 announces itself in a header; v1 only has a body
  const headerValue = first.headers.get("payment-required");
  const required = headerValue ? unb64(headerValue) : await first.json();
  const version = required.x402Version || 1;
  const accepted = required.accepts[0];

  const wallet = new ethers.Wallet(pk);
  const now = Math.floor(Date.now() / 1000);
  const authorization = {
    from: wallet.address,
    to: accepted.payTo,
    // v2 calls it `amount`, v1 `maxAmountRequired`
    value: String(accepted.amount ?? accepted.maxAmountRequired),
    validAfter: "0",
    validBefore: String(now + 300),
    nonce: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
  };
  const signature = await wallet._signTypedData(
    {
      name: accepted.extra.name,
      version: accepted.extra.version,
      chainId: chainIdOf(accepted.network),
      verifyingContract: accepted.asset,
    },
    EIP3009_TYPES,
    authorization
  );

  if (version >= 2) {
    // The facilitator indexes an endpoint only when the settled payment
    // carries the server's own discovery declaration back to it — both
    // `resource` and `extensions`. Echoing one without the other settles
    // the payment and lists nothing, which is exactly what happened on the
    // first two attempts.
    const payload = b64({
      x402Version: 2,
      resource: required.resource,
      ...(required.extensions ? { extensions: required.extensions } : {}),
      accepted,
      payload: { authorization, signature },
    });
    return fetch(url, { headers: { ...headers, "PAYMENT-SIGNATURE": payload } });
  }

  const payload = b64({
    x402Version: 1,
    scheme: "exact",
    network: accepted.network,
    payload: { authorization, signature },
  });
  return fetch(url, { headers: { ...headers, "X-PAYMENT": payload } });
}

/** Settlement receipt from a paid response, whichever version answered. */
export function settlementOf(response) {
  const h = response.headers.get("payment-response") || response.headers.get("x-payment-response");
  if (!h) return null;
  try {
    return unb64(h);
  } catch {
    return null;
  }
}

/** Facilitator's word on whether the Bazaar indexed this settlement. */
export function bazaarStatusOf(response) {
  const h = response.headers.get("extension-responses");
  if (!h) return null;
  try {
    return unb64(h);
  } catch {
    return h;
  }
}
