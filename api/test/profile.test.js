// The profile makes one promise in its own response text: "the number can
// be recomputed rather than trusted". That is a falsifiable claim, and it
// is the sort of thing a conformance auditor bills a seller for getting
// wrong. These tests are the claim, checked — they recompute the score
// from the published signals and weights and insist the two agree.
import { test } from "node:test";
import assert from "node:assert/strict";
import { marketProfile, WEIGHTS, compactProfile } from "../profile.js";

const market = (risk = {}, over = {}) => ({
  address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
  symbol: "SPARKUSDC", name: "Spark USDC Vault", protocol: "morpho",
  apy: 8, tvlUsd: 50_000_000,
  asset: { address: "0x833589", symbol: "USDC", decimals: 6 },
  risk: {
    curatorFeePct: 10, ageDays: 180, apyFromInterest: 8, apyFromIncentives: 0,
    marketCount: 4, topAllocationPct: 40, utilizationPct: 80, freeLiquidityUsd: 9_000_000,
    ...risk,
  },
  ...over,
});

const series = (observations, volatility = 1) => ({
  observations,
  stats: { volatility },
});

const profileOf = (m, history = series(30)) =>
  marketProfile("sparkusdc", {}, { vaults: [m], history: async () => history });

// The claim, stated as arithmetic.
const recompute = (p) => {
  const used = Object.entries(p.signals).filter(([, s]) => s.score != null);
  const totalWeight = used.reduce((a, [k]) => a + p.method.weights[k], 0);
  return Math.round(
    used.reduce((a, [k, s]) => a + s.score * p.method.weights[k], 0) / totalWeight
  );
};

test("the published score is reproducible from the published signals", async () => {
  for (const risk of [
    {},
    { curatorFeePct: 0, ageDays: 900, topAllocationPct: 5, utilizationPct: 10 },
    { curatorFeePct: 25, ageDays: 3, topAllocationPct: 99, utilizationPct: 99 },
  ]) {
    const p = await profileOf(market(risk));
    assert.equal(p.score, recompute(p), `score does not match its own formula for ${JSON.stringify(risk)}`);
  }
});

test("a signal without data is excluded from the weighting, not scored zero", async () => {
  // Fewer than five snapshots: stability is unknown. If it were quietly
  // treated as zero it would drag a good market down by a fifth.
  const thin = await profileOf(market(), series(2));
  const full = await profileOf(market(), series(30, 0));

  assert.equal(thin.signals.stability.score, null);
  assert.equal(thin.signals.stability.value, null);
  assert.ok(!("stability" in thin.method.applied), "an unknown signal must not claim weight");
  assert.equal(thin.score, recompute(thin));

  assert.ok("stability" in full.method.applied);
  assert.ok(
    thin.score > 0,
    "a missing signal must not be able to zero the score on its own"
  );
});

test("method.applied lists exactly the signals that carried weight", async () => {
  const p = await profileOf(market(), series(1));
  const scored = Object.entries(p.signals).filter(([, s]) => s.score != null).map(([k]) => k);
  assert.deepEqual(Object.keys(p.method.applied).sort(), scored.sort());
  for (const [k, w] of Object.entries(p.method.applied)) assert.equal(w, WEIGHTS[k]);
});

test("every signal the code emits has a weight — none is silently ignored", async () => {
  // `WEIGHTS[k] || 0` means a renamed signal would still be computed and
  // displayed while contributing nothing. That failure is invisible in the
  // response, so it is pinned here instead.
  const p = await profileOf(market());
  for (const key of Object.keys(p.signals)) {
    assert.ok(WEIGHTS[key] > 0, `signal "${key}" carries no weight and would be ignored`);
  }
});

test("bands follow the thresholds the description states", async () => {
  const best = await profileOf(
    market({ curatorFeePct: 0, ageDays: 3650, topAllocationPct: 0, utilizationPct: 0 },
           { tvlUsd: 500_000_000 }),
    series(30, 0)
  );
  const worst = await profileOf(
    market({ curatorFeePct: 25, ageDays: 0, topAllocationPct: 100, utilizationPct: 100,
             apyFromInterest: 0, apyFromIncentives: 8 }, { tvlUsd: 500_000 }),
    series(30, 10)
  );
  assert.equal(best.band, "solid", `expected solid, got ${best.band} at ${best.score}`);
  assert.equal(worst.band, "fragile", `expected fragile, got ${worst.band} at ${worst.score}`);
  assert.ok(best.score > worst.score);
});

test("an unknown market is null, not a profile of nothing", async () => {
  const p = await marketProfile("does-not-exist", {}, { vaults: [market()], history: async () => null });
  assert.equal(p, null);
});

test("a market with no risk block has no compact profile to show", () => {
  assert.equal(compactProfile({ apy: 8 }), null);
  const c = compactProfile(market());
  assert.equal(c.curatorFeePct, 10);
  assert.equal(c.incentiveSharePct, 0, "all interest, no incentives");
});

test("weights sum to 110, and the formula normalises rather than assuming 100", async () => {
  // Worth pinning: a reader who assumes these are percentages of 100 would
  // mis-recompute every score. The divisor is the sum of applied weights.
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 110);
  const p = await profileOf(market());
  const applied = Object.values(p.method.applied).reduce((a, b) => a + b, 0);
  assert.equal(p.score, recompute(p));
  assert.ok(applied <= 110);
});

test("stability says whose fault the missing data is", async () => {
  const ours = await marketProfile("sparkusdc", {}, {
    vaults: [market()],
    history: async () => ({ observations: 0, months_unreadable: 2 }),
  });
  assert.match(ours.signals.stability.note, /for our reasons, not the market's/);

  const theirs = await marketProfile("sparkusdc", {}, {
    vaults: [market()],
    history: async () => ({ observations: 2, months_unreadable: 0 }),
  });
  assert.match(theirs.signals.stability.note, /needs 5 daily snapshots, have 2/);

  // Either way the signal is excluded rather than scored zero.
  assert.equal(ours.signals.stability.score, null);
  assert.equal(theirs.signals.stability.score, null);
});
