// The chain is the only durable record of what was bought here. The request
// path lives in a runtime log this host keeps for an hour; the transfer is
// permanent. So each paid route charges a different number of atomic USDC,
// and these tests hold the two things that makes true: the amounts stay
// distinct, and nothing that reads them guesses when it cannot know.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  paidRoutes, knownAmounts, routeResolver, ROUTE_TAG, TAGGED_FROM_BLOCK, usdFromAtomic,
} from "../catalogue.js";
import { TIERS } from "../subscriptions.js";
import { createX402 } from "../x402.js";

const SHELF = { priceUsdc: "0.001", priceAtomic: "1000", tiers: TIERS };
const shelf = () => paidRoutes(SHELF);

test("no two paid routes charge the same amount", () => {
  // The premise of the whole scheme. Two routes at one price and the
  // transfer says only that someone paid.
  const amounts = shelf().map((r) => r.atomic);
  assert.equal(
    new Set(amounts).size,
    amounts.length,
    `amounts collide: ${amounts.join(", ")}`
  );
});

test("/v1/best still charges the base amount, so the indexed entry stays payable", () => {
  // It is the one route the CDP discovery index carries. A cached entry
  // quotes the amount it was indexed with: change it and the only working
  // discovery path answers 402 to a payer who did everything right.
  assert.equal(ROUTE_TAG["/v1/best"], 0);
  const best = shelf().find((r) => r.path === "/v1/best");
  assert.equal(best.atomic, "1000");
  assert.equal(best.price, "$0.001");
});

test("the advertised price and the amount that settles are the same number", () => {
  for (const r of shelf()) {
    assert.equal(
      r.price,
      `$${usdFromAtomic(r.atomic)}`,
      `${r.path}: advertised ${r.price}, settles ${r.atomic}`
    );
    assert.equal(
      String(Math.round(parseFloat(r.price.replace("$", "")) * 1e6)),
      r.atomic,
      `${r.path}: a price list that rounds away from the paywall is a route nobody can buy`
    );
  }
});

test("the payment scan knows every amount the paywall charges", () => {
  // An amount charged but not scanned is revenue that disappears from
  // /stats, the badge and the cashback programme at once, with nothing
  // erroring anywhere.
  const known = new Set(knownAmounts(SHELF));
  for (const r of shelf()) {
    assert.ok(known.has(r.atomic), `${r.path} charges ${r.atomic}, which the scan ignores`);
  }
});

test("a tagged amount names its route at any block", () => {
  // 1001 and 1002 could not exist before the tags, so they are unambiguous
  // wherever they appear — including in blocks older than the cutover.
  const routeOf = routeResolver(SHELF);
  assert.equal(routeOf("1001", 53_100_000), "/v1/yields");
  assert.equal(routeOf("1002", 53_100_000), "/v1/vaults");
  assert.equal(routeOf(1001, TAGGED_FROM_BLOCK + 1), "/v1/yields");
});

test("the base amount is unattributed before the cutover and /v1/best after it", () => {
  // Every per-request route charged 1000 before this change, so an older
  // transfer at 1000 could be any of the three. Reporting it as /v1/best
  // would be a guess printed inside a figure sold as on-chain-verifiable.
  const routeOf = routeResolver(SHELF);
  assert.equal(routeOf("1000", TAGGED_FROM_BLOCK - 1), null);
  assert.equal(routeOf("1000", TAGGED_FROM_BLOCK), "/v1/best");
});

test("an amount this service never charged is never attributed", () => {
  const routeOf = routeResolver(SHELF);
  assert.equal(routeOf("777", 53_500_000), null);
  assert.equal(routeOf("1003", 53_500_000), null, "an unused tag is not a route");
  assert.equal(routeOf("19000000", 53_100_000), "/v1/subscribe/developer");
});

// --- what /stats does with it ------------------------------------------------

let instance = 0;
const freshStats = async () => import(`../stats.js?case=attr${++instance}`);

const pay = (value, block, from = "0xaaa1") => ({
  from, value, block, ts: Math.floor(Date.now() / 1000) - 86400,
});

const statsWith = async (payments) => {
  const mod = await freshStats();
  return mod.fetchPaymentStats(
    { payTo: "0x2Ab5", usdc: "0x8335", knownAmounts: knownAmounts(SHELF), routeOf: routeResolver(SHELF) },
    {
      ledger: async () => ({ lastBlock: 53_300_000, payments: [] }),
      scan: async () => ({ payments, scannedTo: 53_500_000, reachedHead: true }),
    }
  );
};

test("revenue is split by the route the chain says earned it", async () => {
  const d = await statsWith([
    pay(1001, 53_500_000),
    pay(1001, 53_500_001),
    pay(1002, 53_500_002),
    pay(1000, TAGGED_FROM_BLOCK + 10),
  ]);
  assert.equal(d.all_time.by_route["/v1/yields"].payments, 2);
  assert.equal(d.all_time.by_route["/v1/vaults"].payments, 1);
  assert.equal(d.all_time.by_route["/v1/best"].payments, 1);
  assert.equal(d.all_time.by_route["/v1/yields"].revenue_usdc, 0.002002);
});

test("payments older than the tags are named unattributed, not assigned", async () => {
  const d = await statsWith([pay(1000, 53_210_702), pay(1000, 53_287_268), pay(1002, 53_500_000)]);
  assert.equal(d.all_time.by_route.unattributed.payments, 2);
  assert.equal(d.all_time.by_route["/v1/best"], undefined);
  assert.equal(d.all_time.by_route["/v1/vaults"].payments, 1);
});

test("the split never loses or invents revenue", async () => {
  // A breakdown that does not sum to the total is worse than no breakdown:
  // both numbers are published side by side and one of them is wrong.
  const d = await statsWith([
    pay(1000, 53_210_702), pay(1001, 53_500_000), pay(1002, 53_500_001),
    pay(19_000_000, 53_500_002), pay(99_000_000, 53_500_003),
  ]);
  const split = Object.values(d.all_time.by_route);
  assert.equal(
    split.reduce((s, x) => s + x.payments, 0),
    d.all_time.payments
  );
  assert.equal(
    Number(split.reduce((s, x) => s + x.revenue_usdc, 0).toFixed(6)),
    d.all_time.revenue_usdc
  );
});

// --- and what the self-hosted paywall quotes --------------------------------

test("the fallback paywall quotes the route's own amount, not a flat price", async () => {
  // Production runs the CDP facilitator, but if the two paths charge
  // different amounts then the catalogue advertises one price and the 402
  // demands another — the drift this whole file exists to prevent.
  const amountOf = Object.fromEntries(shelf().map((r) => [r.path, r.atomic]));
  const gate = await createX402(
    {
      chainId: 8453, network: "base",
      usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payTo: "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661",
      priceAtomic: "1000",
      amountFor: (path) => amountOf[path],
    },
    {
      usdc: { name: async () => "USD Coin", version: async () => "2",
              authorizationState: async () => false },
      hasRelayer: true,
    }
  );

  for (const r of shelf()) {
    const res = {
      code: null, body: null,
      status(c) { this.code = c; return this; },
      json(b) { this.body = b; return this; },
      set() {},
    };
    await gate(
      { header: () => undefined, path: r.path, originalUrl: r.path },
      res,
      () => assert.fail("an unpaid request must not reach the handler")
    );
    assert.equal(res.code, 402);
    assert.equal(
      res.body.accepts[0].maxAmountRequired,
      r.atomic,
      `${r.path}: 402 quotes ${res.body.accepts[0].maxAmountRequired}, catalogue says ${r.atomic}`
    );
  }
  assert.ok(ethers.BigNumber.from("1002").gt("1000"), "sanity: the tags are real amounts");
});
