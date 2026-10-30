#!/usr/bin/env node
// Recipe: is anything I'm in worth moving out of?
//
// Reads a wallet's positions straight from the chain, then asks the two
// questions a spot APY cannot answer: has this rate drifted from what it
// was when I entered, and is the difference to a better market worth the
// gas it costs to move?
//
//   node watch-positions.js 0xYourAddress
//
// Read-only. No key, no signup; one dependency (ethers) for the balance
// calls, everything else is plain fetch.
import { ethers } from "ethers";

const API = process.env.STAKECHAIN_API || "https://stakechain-api.vercel.app";
const RPC = process.env.BASE_RPC || "https://base-rpc.publicnode.com";
const GAS_COST_USD = Number(process.env.GAS_COST_USD || 0.05); // Base, approx, both legs

const account = process.argv[2];
if (!account) {
  console.error("usage: node watch-positions.js 0xYourAddress");
  process.exit(1);
}

const get = async (path) => (await fetch(`${API}${path}`)).json();
const usd = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const provider = new ethers.providers.JsonRpcProvider(RPC);
const { vaults } = await get("/vaults");

// Aave positions are aToken balances, ERC-4626 vaults report maxWithdraw.
// Settled rather than all, so one unreadable market cannot hide the rest.
const balances = await Promise.allSettled(
  vaults.map((v) =>
    v.protocol === "aave"
      ? new ethers.Contract(v.address, ["function balanceOf(address) view returns (uint256)"], provider).balanceOf(account)
      : new ethers.Contract(v.address, ["function maxWithdraw(address) view returns (uint256)"], provider).maxWithdraw(account)
  )
);

const held = vaults
  .map((v, i) => ({
    v,
    amount:
      balances[i].status === "fulfilled"
        ? Number(ethers.utils.formatUnits(balances[i].value, v.asset.decimals))
        : 0,
  }))
  .filter((p) => p.amount > 0);

if (!held.length) {
  console.log(`No positions found for ${account} on the markets this API tracks.`);
  process.exit(0);
}

console.log(`\n${held.length} position(s) for ${account.slice(0, 10)}…\n`);

let total = 0;
let annual = 0;

for (const { v, amount } of held) {
  total += amount;
  annual += (amount * v.apy) / 100;

  const id = `vault:${v.address.toLowerCase()}`;
  const history = await get(`/history?pool=${id}&days=30`).catch(() => null);

  console.log(`${v.name}`);
  console.log(`  ${amount.toFixed(4)} ${v.asset.symbol} at ${v.apy}% — about ${usd((amount * v.apy) / 100)} a year`);

  if (history?.observations >= 5) {
    const s = history.stats;
    const drift = v.apy - s.median;
    console.log(
      `  30-day range ${s.min}–${s.max}%, median ${s.median}% ` +
        `(today is ${drift >= 0 ? "+" : ""}${drift.toFixed(2)}pp against it)`
    );
    if (s.volatility > 3) {
      console.log(`  ⚠ volatility ${s.volatility}pp — this rate moves a lot, size accordingly`);
    }
  } else {
    console.log(`  rate history: ${history?.observations || 0} snapshot(s) — not enough to judge drift yet`);
  }

  // Would moving to the best market for this asset pay for itself?
  const better = vaults
    .filter((x) => x.asset.symbol === v.asset.symbol && x.apy > v.apy)
    .sort((a, b) => b.apy - a.apy)[0];
  if (better) {
    const gain = (amount * (better.apy - v.apy)) / 100;
    const days = gain > 0 ? (GAS_COST_USD / gain) * 365 : Infinity;
    console.log(
      days < 90
        ? `  → ${better.name} pays ${better.apy}%: +${usd(gain)} a year, gas back in ${Math.ceil(days)} days`
        : `  → ${better.name} pays ${better.apy}%, but +${usd(gain)} a year takes ${Math.ceil(days)} days to cover gas — stay put`
    );
  }
  console.log();
}

console.log(`Total ${usd(total)} earning about ${usd(annual)} a year — a blended ${((annual / total) * 100).toFixed(2)}%`);
console.log("\nMarket data, not advice. Rates are variable; a better rate today can be a worse one next week.");
