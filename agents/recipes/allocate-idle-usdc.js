#!/usr/bin/env node
// Recipe: where should idle USDC go this week?
//
// The naive answer is "the highest APY", which is how capital ends up in a
// vault that printed 24% yesterday and 17% today. This walks the shelf,
// applies constraints an allocator would actually hold, checks each
// candidate's profile, and prints its reasoning — including why the
// runner-up lost.
//
// Decision support, not execution: nothing here signs a transaction.
//
//   node allocate-idle-usdc.js [amount-usd]
//
// No key, no signup, no dependencies.
const API = process.env.STAKECHAIN_API || "https://stakechain-api.vercel.app";

// Constraints. These are the interesting part — change them to match the
// mandate you actually have, rather than the one the APY implies.
const RULES = {
  asset: "USDC",
  minTvlUsd: 10_000_000, // can your position leave without moving the rate?
  maxCuratorFeePct: 15, // the curator's cut comes out before the rate you see
  minAgeDays: 180, // has it survived a market it did not expect?
  maxTopAllocationPct: 95, // everything in one market is one market's risk
  maxIncentiveSharePct: 50, // incentives stop; borrower interest does not
};

const amount = Number(process.argv[2] || 10_000);
const get = async (path) => (await fetch(`${API}${path}`)).json();
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");

const { vaults } = await get("/vaults");

const candidates = [];
const rejected = [];

const unverifiable = [];

for (const v of vaults) {
  if (v.asset.symbol !== RULES.asset) continue;
  // Aave reserves carry no curator/age/allocation block — there is no
  // curator to take a cut and no allocation to concentrate. Rules written
  // for vaults cannot be applied to them, and silently passing a check
  // you did not run is how an allocator fools itself.
  if (!v.risk) {
    unverifiable.push(v);
    continue;
  }
  const r = v.risk;
  const incentiveShare = v.apy > 0 ? ((r.apyFromIncentives || 0) / v.apy) * 100 : 0;

  const fails = [
    v.tvlUsd < RULES.minTvlUsd && `TVL ${usd(v.tvlUsd)} below ${usd(RULES.minTvlUsd)}`,
    r.curatorFeePct > RULES.maxCuratorFeePct && `curator keeps ${r.curatorFeePct}%`,
    r.ageDays != null && r.ageDays < RULES.minAgeDays && `only ${r.ageDays} days old`,
    r.topAllocationPct > RULES.maxTopAllocationPct &&
      `${r.topAllocationPct}% sits in a single market`,
    incentiveShare > RULES.maxIncentiveSharePct &&
      `${incentiveShare.toFixed(0)}% of the yield is incentives`,
  ].filter(Boolean);

  if (fails.length) rejected.push({ v, fails });
  else candidates.push(v);
}

if (!candidates.length) {
  console.log(`Nothing on the shelf clears these rules for ${RULES.asset}.`);
  console.log("Closest misses:");
  for (const { v, fails } of rejected.slice(0, 3)) {
    console.log(`  ${v.name} (${v.apy}%) — ${fails[0]}`);
  }
  process.exit(0);
}

// A rate that only appeared yesterday is worth less than the same rate
// that has held for a month. This is the step a spot-APY ranking skips.
const scored = [];
for (const v of candidates) {
  const id = `vault:${v.address.toLowerCase()}`;
  const [history, profile] = await Promise.all([
    get(`/history?pool=${id}&days=30`),
    get(`/profile?pool=${v.symbol}`),
  ]);
  scored.push({ v, history, profile });
}

scored.sort((a, b) => (b.profile.score ?? 0) - (a.profile.score ?? 0));

console.log(`\nAllocating ${usd(amount)} ${RULES.asset} — ${scored.length} market(s) clear the rules\n`);

const [best, ...rest] = scored;
const r = best.v.risk;
console.log(`→ ${best.v.name}`);
console.log(`  ${best.v.apy}% APY · ${usd(best.v.tvlUsd)} · profile ${best.profile.score}/100 (${best.profile.band})`);
console.log(`  curator fee ${r.curatorFeePct}% · ${r.ageDays} days old · ${r.marketCount} market(s), largest ${r.topAllocationPct}% (${r.topCollateral})`);
console.log(
  best.history.observations >= 5
    ? `  rate over ${best.history.observations} days: ${best.history.stats.min}–${best.history.stats.max}%, volatility ${best.history.stats.volatility}pp`
    : `  rate history: only ${best.history.observations} snapshot(s) so far — stability unproven`
);
console.log(`  at this rate, ${usd(amount)} earns about ${usd((amount * best.v.apy) / 100)} a year, before gas`);
console.log(`  deposit to ${best.v.depositTo}`);

if (rest.length) {
  console.log("\nAlso cleared:");
  for (const s of rest) {
    const fee = s.v.risk ? `fee ${s.v.risk.curatorFeePct}%` : "no curator";
    console.log(`  ${s.v.name} — ${s.v.apy}% · profile ${s.profile.score} · ${fee}`);
  }
}

if (rejected.length) {
  console.log(`\nRejected ${rejected.length}, highest rates first:`);
  for (const { v, fails } of rejected.sort((a, b) => b.v.apy - a.v.apy).slice(0, 4)) {
    console.log(`  ${v.name} (${v.apy}%) — ${fails.join("; ")}`);
  }
}

if (unverifiable.length) {
  console.log("\nNot judged by these rules (no curator, age or allocation to check):");
  for (const v of unverifiable) {
    console.log(`  ${v.name} — ${v.apy}% · ${usd(v.tvlUsd)} · ${v.protocol}`);
  }
}

console.log("\nMarket data, not advice. Rates are variable and these rules are mine, not yours.");
