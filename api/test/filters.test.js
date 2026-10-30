import { test } from "node:test";
import assert from "node:assert/strict";
import { baseYields, applyQuery, pickBest } from "../filters.js";

const raw = [
  { chain: "Base", project: "aave-v3", symbol: "USDC", apy: 5.1234, apyBase: 5.1234, apyReward: null, tvlUsd: 50_000_000, stablecoin: true, ilRisk: "no", pool: "a" },
  { chain: "Base", project: "degen-farm", symbol: "SPCX-USDC", apy: 334995.82, apyBase: null, apyReward: 334995.82, tvlUsd: 218_080, stablecoin: false, ilRisk: "yes", pool: "b" },
  { chain: "Base", project: "aerodrome-v1", symbol: "USDC-AERO", apy: 190.88, apyBase: null, apyReward: 190.88, tvlUsd: 6_861_779, stablecoin: false, ilRisk: "yes", pool: "c" },
  { chain: "Base", project: "harvest-finance", symbol: "USDC", apy: 29.67, apyBase: 29.67, apyReward: null, tvlUsd: 1_752_085, stablecoin: true, ilRisk: "no", pool: "d" },
  { chain: "Ethereum", project: "lido", symbol: "STETH", apy: 3.0, apyBase: 3.0, apyReward: null, tvlUsd: 20_000_000_000, stablecoin: false, ilRisk: "no", pool: "e" },
  { chain: "Base", project: "tiny", symbol: "ETH", apy: 9.9, apyBase: 9.9, apyReward: null, tvlUsd: 50_000, stablecoin: false, ilRisk: "no", pool: "f" },
  { chain: "Base", project: "dead", symbol: "DAI", apy: 0, apyBase: 0, apyReward: null, tvlUsd: 5_000_000, stablecoin: true, ilRisk: "no", pool: "g" },
];

test("baseYields keeps only Base pools with TVL > $100k and positive APY, sorted by TVL", () => {
  const pools = baseYields(raw);
  assert.deepEqual(pools.map((p) => p.pool), ["a", "c", "d", "b"]);
  assert.ok(pools.every((p) => p.tvlUsd > 100_000 && p.apy > 0));
});

test("baseYields prefers the protocol's own site and keeps the llama fallback", () => {
  const pools = baseYields(raw, { "aave-v3": "https://aave.com" });
  const aave = pools.find((p) => p.project === "aave-v3");
  assert.equal(aave.url, "https://aave.com");
  assert.equal(aave.llamaUrl, "https://defillama.com/yields/pool/a");
  const harvest = pools.find((p) => p.project === "harvest-finance");
  assert.match(harvest.url, /defillama\.com/);
});

test("applyQuery filters by asset, stable and minTvl, sorts by APY", () => {
  const pools = baseYields(raw);
  // pool "b" is a 334,995% farm: the default ceiling drops it, so the
  // USDC count is one lower than the raw match
  assert.equal(applyQuery(pools, { asset: "usdc" }).length, 3);
  assert.equal(applyQuery(pools, { asset: "usdc", maxApy: Infinity }).length, 4);
  assert.equal(applyQuery(pools, { stable: "true" }).length, 2);
  assert.equal(applyQuery(pools, { minTvl: 10_000_000 }).length, 1);
  const sorted = applyQuery(pools, { sort: "apy" });
  assert.equal(sorted[0].pool, "c", "the farm is gone; the next-highest leads");
});

test("pickBest skips degen traps: APY ceiling, min TVL, IL risk", () => {
  const pools = baseYields(raw);
  const best = pickBest(pools, { asset: "USDC" });
  assert.equal(best.project, "harvest-finance");
});

test("pickBest can opt into LP farms", () => {
  const pools = baseYields(raw);
  const best = pickBest(pools, { asset: "USDC", includeLp: true });
  assert.equal(best.project, "aerodrome-v1");
});

test("pickBest returns null when nothing qualifies", () => {
  const pools = baseYields(raw);
  assert.equal(pickBest(pools, { asset: "CBBTC" }), null);
});

test("applyQuery caps runaway APYs by default and lifts the cap on request", () => {
  const pools = baseYields(raw);
  const ranked = applyQuery(pools, { sort: "apy" });
  assert.ok(
    ranked.every((p) => p.apy <= 1000),
    "a four-digit APY must not be the first thing an agent sees"
  );
  const raised = applyQuery(pools, { sort: "apy", maxApy: Infinity });
  assert.equal(raised[0].apy, 334995.82, "an explicit ceiling lets the farm through");
});

test("applyQuery can exclude impermanent-loss exposure", () => {
  const out = applyQuery(baseYields(raw), { noIl: true });
  assert.ok(out.every((p) => p.ilRisk === "no"));
  assert.ok(out.length < baseYields(raw).length);
});
