// A transient RPC error used to cost a whole day of the one dataset here
// that cannot be backfilled. On 2026-11-03 the daily ledger job died on a
// single `broker: node error` 500 from publicnode, and because that step
// runs before the commit step, the rate snapshot taken minutes earlier was
// thrown away with it. These tests pin the retry that closes it: take the
// loop out of withRetry and every one of them fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanPayments, withRetry } from "../stats.js";

const noSleep = async () => {};
const PAY_TO = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const TOPIC_TO = "0x" + PAY_TO.toLowerCase().slice(2).padStart(64, "0");
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const log = (block) => ({
  blockNumber: block,
  data: "0x" + (1000).toString(16).padStart(64, "0"),
  topics: [TRANSFER, "0x" + "11".padStart(64, "0"), TOPIC_TO],
});

// Fails its first `failures` getLogs calls with the exact error seen in
// production, then serves one matching payment.
function flaky(failures, { head = 53_100_010, label = "flaky" } = {}) {
  let seen = 0;
  return {
    label,
    calls: () => seen,
    getBlockNumber: async () => head,
    getBlock: async (b) => ({ timestamp: 1_793_000_000 + b }),
    getLogs: async () => {
      seen++;
      if (seen <= failures) {
        const e = new Error("broker: node error");
        e.code = "SERVER_ERROR";
        e.status = 500;
        throw e;
      }
      return [log(53_100_005)];
    },
  };
}

const args = {
  payTo: PAY_TO,
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  knownAmounts: ["1000"],
  fromBlock: 53_100_000,
};

test("one transient RPC failure no longer loses the scan", async () => {
  const p = flaky(1);
  const out = await scanPayments(args, { providers: [p], attempts: 3, sleep: noSleep });
  assert.equal(out.payments.length, 1, "the payment after the retry must still be counted");
  assert.equal(out.reachedHead, true);
  assert.equal(p.calls(), 2, "exactly one retry");
});

test("two failures in a row are still survived when attempts allow it", async () => {
  const p = flaky(2);
  const out = await scanPayments(args, { providers: [p], attempts: 3, sleep: noSleep });
  assert.equal(out.payments.length, 1);
  assert.equal(p.calls(), 3);
});

test("a second endpoint is a failover, not just a retry", async () => {
  const dead = flaky(Infinity, { label: "dead" });
  const live = flaky(0, { label: "live" });
  const out = await scanPayments(args, {
    providers: [dead, live],
    attempts: 2,
    sleep: noSleep,
  });
  assert.equal(out.payments.length, 1);
  assert.equal(dead.calls(), 1, "the dead endpoint is tried once");
  assert.equal(live.calls(), 1, "then the next one in the list serves it");
});

test("when every attempt fails the original error propagates, not a silent zero", async () => {
  const p = flaky(Infinity);
  await assert.rejects(
    () => scanPayments(args, { providers: [p], attempts: 3, sleep: noSleep }),
    /broker: node error/,
    "an unreadable chain must not read as 'no payments'"
  );
  assert.equal(p.calls(), 3);
});

test("withRetry backs off exponentially and stops after the last attempt", async () => {
  const waits = [];
  let n = 0;
  await assert.rejects(() =>
    withRetry(
      () => {
        n++;
        throw new Error("nope");
      },
      { attempts: 4, baseDelayMs: 100, sleep: async (ms) => waits.push(ms) }
    )
  );
  assert.equal(n, 4, "all attempts used");
  assert.deepEqual(waits, [100, 200, 400], "no sleep after the final attempt");
});

test("a succeeding call is not retried and not delayed", async () => {
  const waits = [];
  let n = 0;
  const v = await withRetry(async () => { n++; return "ok"; },
    { attempts: 3, sleep: async (ms) => waits.push(ms) });
  assert.equal(v, "ok");
  assert.equal(n, 1);
  assert.deepEqual(waits, []);
});
