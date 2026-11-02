// The programme pays real tokens out of a wallet, from a record that used to
// live in a file. On 2026-11-02 a run sent 1 STACH, the RPC refused the
// receipt lookup, and the record was never written — so the next run would
// have sent it again. These tests hold the property that replaced the file:
// what is owed is earned minus what the chain shows was delivered.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { earned, alreadyPaid, owed, delivered } from "../rewards.js";

const RATES = { "1000": "1", "1001": "1", "1002": "1", "19000000": "8000" };
const A = "0xaaaa000000000000000000000000000000000001";
const B = "0xbbbb000000000000000000000000000000000002";
const OURS = "0xc6f83f23a899fe73127168a6d6d2e1f93e65a92d";
const eth = (n) => ethers.utils.parseEther(String(n));

test("a payment at a known price earns its rate; an unknown amount earns nothing", () => {
  const e = earned({
    payments: [
      { from: A, value: "1000" },
      { from: A, value: "1002" },
      { from: B, value: "19000000" },
      { from: B, value: "58318591" }, // a bridge delivery, not a purchase
    ],
    rates: RATES,
  });
  assert.equal(e[A].toString(), eth(2).toString());
  assert.equal(e[B].toString(), eth(8000).toString(), "the stray transfer earned nothing");
});

test("our own wallets earn nothing however much they pay", () => {
  const e = earned({
    payments: [{ from: OURS, value: "1000" }, { from: OURS, value: "1001" }, { from: A, value: "1000" }],
    rates: RATES,
    excluded: new Set([OURS]),
  });
  assert.equal(e[OURS], undefined);
  assert.equal(e[A].toString(), eth(1).toString());
});

test("a payout already on chain is not owed again", () => {
  // The exact shape of the 2026-11-02 failure: the transfer landed, the
  // ledger entry did not. Recomputing from the chain must find nothing owed.
  const e = earned({ payments: [{ from: A, value: "1000" }], rates: RATES });
  const paid = alreadyPaid({ transfers: [{ to: A, value: eth(1).toString() }] });
  assert.deepEqual(owed(e, paid), {}, "the landed payout would have been sent twice");
});

test("a partly paid payer is owed only the remainder", () => {
  const e = earned({ payments: [{ from: A, value: "1000" }, { from: A, value: "1001" }, { from: A, value: "1002" }], rates: RATES });
  const paid = alreadyPaid({ transfers: [{ to: A, value: eth(1).toString() }] });
  assert.equal(owed(e, paid)[A].toString(), eth(2).toString());
});

test("an overpaid payer is owed zero, not a negative that offsets others", () => {
  const e = earned({ payments: [{ from: A, value: "1000" }, { from: B, value: "1000" }], rates: RATES });
  const paid = alreadyPaid({ transfers: [{ to: A, value: eth(50).toString() }] });
  const o = owed(e, paid);
  assert.equal(o[A], undefined);
  assert.equal(o[B].toString(), eth(1).toString(), "B's earnings must not absorb A's overpayment");
});

test("a bridged payout counts even though the chain sent it to the adapter", () => {
  // Bridged rewards leave as a transfer to the LayerZero lockbox, so the Base
  // side cannot name the payer. The ledger is the only witness, and it has to
  // be consulted or the payer is paid twice.
  const e = earned({ payments: [{ from: A, value: "1000" }], rates: RATES });
  const paid = alreadyPaid({ transfers: [], bridged: [{ payer: A, stach: "1", chain: "arbitrum" }] });
  assert.deepEqual(owed(e, paid), {});
});

test("addresses are matched case-insensitively on both sides", () => {
  const e = earned({ payments: [{ from: A.toUpperCase().replace("0X", "0x"), value: "1000" }], rates: RATES });
  const paid = alreadyPaid({ transfers: [{ to: A.toUpperCase().replace("0X", "0x"), value: eth(1).toString() }] });
  assert.deepEqual(owed(e, paid), {}, "a checksummed address must not read as a different payer");
});

test("delivered totals every payout, which is what the published cap is held against", () => {
  const paid = alreadyPaid({
    transfers: [{ to: A, value: eth(1).toString() }, { to: B, value: eth(8000).toString() }],
    bridged: [{ payer: A, stach: "40000", chain: "arbitrum" }],
  });
  assert.equal(delivered(paid).toString(), eth(48001).toString());
});

test("the bridge lockbox is not a payer", () => {
  // Measured on the live chain: 10 STACH sitting in the LayerZero adapter was
  // read as 10 STACH delivered to a payer. It inflates the total the
  // published 1,000,000 cap is held against, and a bridged reward would be
  // counted twice — as the transfer out and as the ledger entry.
  const ADAPTER = "0xa670D30A01e51E728057dD08D9332f0787Aa245c";
  const paid = alreadyPaid({
    transfers: [{ to: ADAPTER, value: eth(10).toString() }, { to: A, value: eth(1).toString() }],
    bridged: [{ payer: B, stach: "1", chain: "arbitrum" }],
    ignore: new Set([ADAPTER]),
  });
  assert.equal(paid[ADAPTER.toLowerCase()], undefined);
  assert.equal(delivered(paid).toString(), eth(2).toString(), "10 in the lockbox is not 10 delivered");
  const e = earned({ payments: [{ from: A, value: "1000" }, { from: B, value: "1000" }], rates: RATES });
  assert.deepEqual(owed(e, paid), {}, "both are settled: one on Base, one bridged");
});
