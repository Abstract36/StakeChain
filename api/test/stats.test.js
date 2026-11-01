// /stats prints a number about ourselves and calls it on-chain-verifiable.
// That is the one claim where being wrong is not a bug but a
// misrepresentation, and it is the number this project has been quoting at
// strangers all week.
//
// Each test takes a fresh module instance: the payment counts are cached
// for ten minutes, and the ledger beneath them for ten more.
import { test } from "node:test";
import assert from "node:assert/strict";

const ANALYST = "0xc6f83f23a899fe73127168a6d6d2e1f93e65a92d";
const OUTSIDER = "0xa1d1c0cf717402ff3651aa4873ccf96410b01978";
const OTHER = "0xc9c7b38c0942914fc8ea12063bc92dcd3b581670";

let instance = 0;
async function fresh(internal = ANALYST) {
  process.env.INTERNAL_PAYERS = internal;
  return import(`../stats.js?case=${++instance}`);
}

const now = () => Math.floor(Date.now() / 1000);
const pay = (from, value = 1000, daysAgo = 1) => ({
  from, value, block: 53_300_000, ts: now() - daysAgo * 86400,
});
const args = { payTo: "0x2Ab5", usdc: "0x8335", knownAmounts: ["1000"] };

const run = (mod, { ledger, scan }) =>
  mod.fetchPaymentStats(args, {
    ledger: async () => ledger,
    scan: async () => scan,
  });

test("revenue and payers are summed over ledger and fresh scan together", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: 53_300_000, payments: [pay(ANALYST), pay(OUTSIDER)] },
    scan: { payments: [pay(OTHER)], scannedTo: 53_400_000, reachedHead: true },
  });
  assert.equal(d.all_time.payments, 3);
  assert.equal(d.all_time.unique_payers, 3);
  assert.equal(d.all_time.revenue_usdc, 0.003);
  assert.equal(d.complete, true);
  assert.equal(d.note, undefined, "a complete reading needs no caveat");
});

test("our own agent is counted but labelled, so it cannot read as demand", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: 1, payments: [pay(ANALYST), pay(ANALYST), pay(OUTSIDER)] },
    scan: { payments: [], scannedTo: 2, reachedHead: true },
  });
  assert.equal(d.all_time.payments, 3);
  assert.equal(d.all_time.internal_payments, 2);
  assert.equal(
    d.all_time.payments - d.all_time.internal_payments,
    1,
    "exactly one payment here is external"
  );
});

test("the same payer twice is two payments and one payer", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: 1, payments: [pay(OUTSIDER), pay(OUTSIDER)] },
    scan: { payments: [], scannedTo: 2, reachedHead: true },
  });
  assert.equal(d.all_time.payments, 2);
  assert.equal(d.all_time.unique_payers, 1);
});

test("the 30-day window excludes older payments from that count only", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: {
      lastBlock: 1,
      payments: [pay(OUTSIDER, 1000, 2), pay(OTHER, 1000, 45)],
    },
    scan: { payments: [], scannedTo: 2, reachedHead: true },
  });
  assert.equal(d.last_30d.payments, 1);
  assert.equal(d.all_time.payments, 2, "all_time keeps what the window drops");
});

test("an unreadable ledger is declared, not quietly served as a total", async () => {
  // Without the anchor the scan restarts at genesis and stops at the chunk
  // cap, so the figure is simply too low. Publishing that as verifiable
  // revenue would be the worst number on the whole site to get wrong.
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: mod.GENESIS_BLOCK - 1, payments: [], unreadable: true },
    scan: { payments: [pay(OUTSIDER)], scannedTo: 53_200_000, reachedHead: false },
  });
  assert.equal(d.complete, false);
  assert.match(d.note, /lower bound, not a total/);
});

test("a scan that stops short of the head says it is behind", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: 53_300_000, payments: [pay(ANALYST)] },
    scan: { payments: [], scannedTo: 53_350_000, reachedHead: false },
  });
  assert.equal(d.complete, false);
  assert.match(d.note, /behind, not final/);
  assert.equal(d.scanned_to_block, 53_350_000);
});

test("payer matching is case-insensitive", async () => {
  const mod = await fresh(ANALYST.toUpperCase());
  const d = await run(mod, {
    ledger: { lastBlock: 1, payments: [pay(ANALYST.toUpperCase()), pay(ANALYST)] },
    scan: { payments: [], scannedTo: 2, reachedHead: true },
  });
  assert.equal(d.all_time.unique_payers, 1, "one wallet, whatever the casing");
  assert.equal(d.all_time.internal_payments, 2);
});

test("with no payments at all the figures are zero, not absent", async () => {
  const mod = await fresh();
  const d = await run(mod, {
    ledger: { lastBlock: 1, payments: [] },
    scan: { payments: [], scannedTo: 2, reachedHead: true },
  });
  assert.equal(d.all_time.payments, 0);
  assert.equal(d.all_time.revenue_usdc, 0);
  assert.equal(d.all_time.unique_payers, 0);
  assert.equal(d.complete, true, "nothing to report is still a complete reading");
});
