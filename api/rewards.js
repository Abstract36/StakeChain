// What the usage-rewards programme owes, computed by subtracting what the
// chain shows was already sent from what the chain shows was earned.
//
// The previous version trusted a committed file instead: it scanned for new
// payments from `ledger.lastBlock + 1`, paid them, and wrote the record once
// at the end. On 2026-11-02 the RPC refused a receipt lookup mid-loop, so a
// payout landed on Base and was never recorded — and because `lastBlock` had
// not advanced either, the next run would have earned and paid it a second
// time. A record that can diverge from the chain cannot be the thing that
// decides whether money moves.
//
// So the programme start block is fixed rather than advancing, both sides are
// recomputed from it every run, and the difference is what gets paid. A crash,
// a lost ledger or a re-run can then only pay what is still owed.
import { ethers } from "ethers";

const Z = ethers.constants.Zero;
const add = (map, key, amount) => {
  map[key] = (map[key] || Z).add(amount);
  return map;
};

/**
 * STACH earned per payer, from USDC payments to the revenue wallet.
 * `rates` maps an exact USDC amount (atomic, as a decimal string) to a STACH
 * figure; an amount that is not a known price point earns nothing, because it
 * is not a purchase.
 */
export function earned({ payments, rates, excluded = new Set() }) {
  const out = {};
  for (const p of payments) {
    const rate = rates[String(p.value)];
    if (!rate) continue;
    const payer = String(p.from).toLowerCase();
    if (excluded.has(payer)) continue;
    add(out, payer, ethers.utils.parseEther(String(rate)));
  }
  return out;
}

/**
 * STACH already delivered per payer.
 *
 * `transfers` are STACH transfers out of the rewards wallet, which is the
 * chain's own record and needs no bookkeeping to stay true. Bridged rewards
 * are the exception: they leave as a transfer to the LayerZero adapter, so the
 * Base side cannot say which payer they were for, and only the ledger knows.
 * Those entries are taken from `bridged` — the one case where a crash mid-
 * payout can still cost the programme a double send.
 *
 * Which is why `ignore` exists and must hold the adapter. Counted as a
 * recipient it becomes a phantom payer, inflates the delivered total the
 * published budget cap is measured against, and double-counts every bridged
 * reward — once as the transfer out and once as the ledger entry. Measured on
 * the live chain before this argument existed: 10 STACH sitting in the
 * lockbox read as 10 STACH delivered to a payer.
 */
export function alreadyPaid({ transfers, bridged = [], ignore = new Set() }) {
  const out = {};
  const skip = new Set([...ignore].map((a) => String(a).toLowerCase()));
  for (const t of transfers) {
    const to = String(t.to).toLowerCase();
    if (skip.has(to)) continue;
    add(out, to, ethers.BigNumber.from(t.value));
  }
  for (const b of bridged) add(out, String(b.payer).toLowerCase(), ethers.utils.parseEther(String(b.stach)));
  return out;
}

/**
 * What is still owed: earned minus delivered, never negative. A payer who was
 * overpaid is left at zero rather than carried as a debt — the programme does
 * not claw back, and a negative balance would quietly offset someone else's
 * earnings on the next run.
 */
export function owed(earnedMap, paidMap) {
  const out = {};
  for (const [payer, amount] of Object.entries(earnedMap)) {
    const left = amount.sub(paidMap[payer] || Z);
    if (left.gt(Z)) out[payer] = left;
  }
  return out;
}

/** Total STACH the programme has delivered, for the published budget cap. */
export const delivered = (paidMap) =>
  Object.values(paidMap).reduce((s, x) => s.add(x), Z);
