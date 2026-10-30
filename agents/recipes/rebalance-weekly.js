#!/usr/bin/env node
// Recipe: I hold several positions — what should I actually move?
//
// The honest answer is usually "less than you think". A better rate is
// only better once it has repaid the gas to reach it, and a rate that
// appeared yesterday is not yet a rate. This proposes a target, prices
// every move, and is explicit about the ones not worth making.
//
//   node rebalance-weekly.js 0xYourAddress
//
// Read-only: it prints a plan, it does not sign anything.
import { ethers } from "ethers";

const API = process.env.STAKECHAIN_API || "https://stakechain-api.vercel.app";
const RPC = process.env.BASE_RPC || "https://base-rpc.publicnode.com";

const RULES = {
  gasCostUsd: Number(process.env.GAS_COST_USD || 0.05), // Base, exit + enter
  maxPaybackDays: 60, // a move that takes longer than this is noise
  minTvlUsd: 5_000_000, // where we are willing to send money
  maxCuratorFeePct: 15,
  minApyGain: 0.5, // percentage points; below this, do not bother
  minHistoryDays: 5, // how much rate history before we trust a target
};

const account = process.argv[2];
if (!account) {
  console.error("usage: node rebalance-weekly.js 0xYourAddress");
  process.exit(1);
}

const get = async (p) => (await fetch(`${API}${p}`)).json();
const usd = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const provider = new ethers.providers.JsonRpcProvider(RPC);

const { vaults } = await get("/vaults");

// Three protocols, three ways to ask "what do I hold here"
const balances = await Promise.allSettled(
  vaults.map(async (v) => {
    if (v.protocol === "aave") {
      return new ethers.Contract(v.address, ["function balanceOf(address) view returns (uint256)"], provider).balanceOf(account);
    }
    if (v.protocol === "moonwell") {
      const mt = new ethers.Contract(
        v.address,
        ["function balanceOf(address) view returns (uint256)", "function exchangeRateStored() view returns (uint256)"],
        provider
      );
      const [bal, rate] = await Promise.all([mt.balanceOf(account), mt.exchangeRateStored()]);
      return bal.mul(rate).div(ethers.BigNumber.from(10).pow(18));
    }
    return new ethers.Contract(v.address, ["function maxWithdraw(address) view returns (uint256)"], provider).maxWithdraw(account);
  })
);

const held = vaults
  .map((v, i) => ({
    v,
    amount: balances[i].status === "fulfilled" ? Number(ethers.utils.formatUnits(balances[i].value, v.asset.decimals)) : 0,
  }))
  .filter((p) => p.amount > 0);

if (!held.length) {
  console.log(`No positions for ${account} on the markets this API tracks.`);
  process.exit(0);
}

// Candidate destinations, per asset, that we would actually use
const eligible = {};
for (const v of vaults) {
  const r = v.risk || {};
  if (v.tvlUsd < RULES.minTvlUsd) continue;
  if (r.curatorFeePct != null && r.curatorFeePct > RULES.maxCuratorFeePct) continue;
  (eligible[v.asset.symbol] ||= []).push(v);
}
for (const list of Object.values(eligible)) list.sort((a, b) => b.apy - a.apy);

const moves = [];
const staying = [];
let total = 0;
let annualNow = 0;

for (const { v, amount } of held) {
  total += amount;
  annualNow += (amount * v.apy) / 100;

  const target = (eligible[v.asset.symbol] || []).find((t) => t.address !== v.address);
  if (!target || target.apy <= v.apy) {
    staying.push({ v, amount, why: "already in the best eligible market for this asset" });
    continue;
  }

  const gain = target.apy - v.apy;
  const annualGain = (amount * gain) / 100;
  const paybackDays = annualGain > 0 ? (RULES.gasCostUsd / annualGain) * 365 : Infinity;
  const history = await get(`/history?pool=vault:${target.address.toLowerCase()}&days=30`).catch(() => null);
  const proven = (history?.observations || 0) >= RULES.minHistoryDays;

  const why =
    gain < RULES.minApyGain
      ? `only +${gain.toFixed(2)}pp — under the ${RULES.minApyGain}pp floor`
      : paybackDays > RULES.maxPaybackDays
      ? `+${usd(annualGain)} a year takes ${Math.ceil(paybackDays)} days to repay ${usd(RULES.gasCostUsd)} of gas`
      : !proven
      ? `${target.name} has only ${history?.observations || 0} day(s) of rate history — not yet a rate, just a number`
      : null;

  if (why) staying.push({ v, amount, why, target, annualGain });
  else moves.push({ v, amount, target, gain, annualGain, paybackDays, history });
}

console.log(`\n${held.length} position(s), ${usd(total)} earning about ${usd(annualNow)} a year (${((annualNow / total) * 100).toFixed(2)}% blended)\n`);

if (moves.length) {
  console.log("Worth moving:");
  let extra = 0;
  for (const m of moves) {
    extra += m.annualGain;
    console.log(`  ${m.v.name} → ${m.target.name}`);
    console.log(`    ${m.amount.toFixed(4)} ${m.v.asset.symbol}: ${m.v.apy}% → ${m.target.apy}% (+${usd(m.annualGain)}/yr, gas back in ${Math.ceil(m.paybackDays)} days)`);
    console.log(`    target held ${m.history.stats.min}–${m.history.stats.max}% over ${m.history.observations} days`);
  }
  console.log(`  Total improvement: ${usd(extra)} a year, ${usd(moves.length * RULES.gasCostUsd)} of gas\n`);
} else {
  console.log("Nothing worth moving this week.\n");
}

console.log("Staying put:");
for (const s of staying) {
  console.log(`  ${s.v.name} (${s.v.apy}%) — ${s.why}`);
}

console.log(`\nRules: gas ${usd(RULES.gasCostUsd)}/move, payback under ${RULES.maxPaybackDays} days, at least +${RULES.minApyGain}pp, target TVL over ${usd(RULES.minTvlUsd)}, curator fee at most ${RULES.maxCuratorFeePct}%, ${RULES.minHistoryDays} days of history.`);
console.log("Edit them at the top — they are mine, not yours. Market data, not advice.");
