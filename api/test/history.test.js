// The volatility figure here is the single input behind the profile's
// `stability` signal, which carries 20 of the 110 weight points and is the
// one number an allocator reads to answer "has this rate held?". The
// profile's tests stub it; nothing checked the arithmetic itself.
//
// Snapshots are fetched over HTTP from the public repo, so these stub
// `fetch` rather than the module: the fetching, the month selection, the
// cutoff and the maths all run for real.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.HISTORY_BASE = "https://history.invalid/data";

// The module caches each month file for 30 minutes, so a second test using
// the same month would read the first one's fixture. Each test takes a
// fresh instance instead of the module growing a test-only reset hook.
let instance = 0;
const freshHistory = async () =>
  (await import(`../history.js?case=${++instance}`)).marketHistory;

const iso = (daysAgo) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

/**
 * Serves each month its own store, as the real files are laid out. Serving
 * one store for every month double-counts every day, which is how the
 * first version of these tests managed to accuse correct code of being
 * wrong.
 */
async function serving(days) {
  const byMonth = {};
  for (const [date, rows] of Object.entries(days)) {
    (byMonth[date.slice(0, 7)] ||= {})[date] = rows;
  }
  globalThis.fetch = async (url) => {
    const name = String(url).match(/([0-9]{4}-[0-9]{2})\.json$/)?.[1];
    const store = byMonth[name];
    if (!store) return { ok: false, status: 404 };
    return { ok: true, json: async () => ({ days: store }) };
  };
  return freshHistory();
}

const row = (id, apy, tvlUsd = 1_000_000) => ({
  id, apy, tvlUsd, project: "morpho-blue", symbol: "SPARKUSDC",
});

test("volatility is the population standard deviation of the observed APYs", async () => {
  // 10, 12, 8, 10 -> mean 10, squared deviations 0+4+4+0 = 8, /4 = 2,
  // sqrt(2) = 1.4142... -> 1.41
  const marketHistory = await serving({
    [iso(4)]: [row("vault:0xa", 10)],
    [iso(3)]: [row("vault:0xa", 12)],
    [iso(2)]: [row("vault:0xa", 8)],
    [iso(1)]: [row("vault:0xa", 10)],
  });
  const h = await marketHistory("vault:0xa", 30);
  assert.equal(h.observations, 4);
  assert.equal(h.stats.mean, 10);
  assert.equal(h.stats.volatility, 1.41);
  assert.equal(h.stats.min, 8);
  assert.equal(h.stats.max, 12);
});

test("median interpolates between the two middle values", async () => {
  // sorted 8, 10, 10, 12 -> pos = 1.5 -> 10 + 0.5*(10-10) = 10
  const marketHistory = await serving({
    [iso(4)]: [row("vault:0xb", 10)],
    [iso(3)]: [row("vault:0xb", 12)],
    [iso(2)]: [row("vault:0xb", 8)],
    [iso(1)]: [row("vault:0xb", 10)],
  });
  assert.equal((await marketHistory("vault:0xb", 30)).stats.median, 10);

  // sorted 1, 2, 3, 100 -> pos 1.5 -> 2 + 0.5*(3-2) = 2.5, and the mean
  // would say 26.5: the median is what survives one bad day
  const marketHistory2 = await serving({
    [iso(4)]: [row("vault:0xc", 1)],
    [iso(3)]: [row("vault:0xc", 2)],
    [iso(2)]: [row("vault:0xc", 3)],
    [iso(1)]: [row("vault:0xc", 100)],
  });
  const spike = await marketHistory2("vault:0xc", 30);
  assert.equal(spike.stats.median, 2.5);
  assert.equal(spike.stats.mean, 26.5);
});

test("a flat rate has zero volatility, a swinging one does not", async () => {
  const marketHistory = await serving({
    [iso(3)]: [row("vault:0xd", 7)],
    [iso(2)]: [row("vault:0xd", 7)],
    [iso(1)]: [row("vault:0xd", 7)],
  });
  assert.equal((await marketHistory("vault:0xd", 30)).stats.volatility, 0);

  // the real case this exists for: 23.9 -> 17.6 inside a day
  const marketHistory2 = await serving({
    [iso(2)]: [row("vault:0xe", 23.9)],
    [iso(1)]: [row("vault:0xe", 17.6)],
  });
  assert.equal((await marketHistory2("vault:0xe", 30)).stats.volatility, 3.15);
});

test("days_at_or_above_current counts against today, not against the mean", async () => {
  const marketHistory = await serving({
    [iso(4)]: [row("vault:0xf", 20)],
    [iso(3)]: [row("vault:0xf", 18)],
    [iso(2)]: [row("vault:0xf", 16)],
    [iso(1)]: [row("vault:0xf", 10)], // today
  });
  const h = await marketHistory("vault:0xf", 30);
  assert.equal(h.current_apy, 10, "current is the latest date, not the last key");
  assert.equal(h.stats.days_at_or_above_current, 4, "today counts itself");
});

test("the series is ordered by date whatever order the store is in", async () => {
  const marketHistory = await serving({
    [iso(1)]: [row("vault:0x1", 3)],
    [iso(3)]: [row("vault:0x1", 1)],
    [iso(2)]: [row("vault:0x1", 2)],
  });
  const h = await marketHistory("vault:0x1", 30);
  assert.deepEqual(h.series.map((s) => s.apy), [1, 2, 3]);
  assert.equal(h.current_apy, 3);
});

test("days where the market is absent are skipped, not read as zero", async () => {
  // A market that was not in the snapshot must not contribute a 0% APY —
  // that would halve the mean and invent volatility out of a gap.
  const marketHistory = await serving({
    [iso(3)]: [row("vault:0x2", 9), row("vault:0xother", 1)],
    [iso(2)]: [row("vault:0xother", 1)],
    [iso(1)]: [row("vault:0x2", 9)],
  });
  const h = await marketHistory("vault:0x2", 30);
  assert.equal(h.observations, 2);
  assert.equal(h.stats.volatility, 0);
  assert.equal(h.stats.mean, 9);
});

test("no snapshots yields no stats rather than an invented zero", async () => {
  const marketHistory = await serving({ [iso(1)]: [row("vault:0xother", 5)] });
  const h = await marketHistory("vault:0xmissing", 30);
  assert.equal(h.observations, 0);
  assert.deepEqual(h.series, []);
  assert.equal(h.stats, undefined, "absent data must not produce a stats block");
  assert.match(h.note, /no snapshots yet/);
});

test("observations older than the window are excluded", async () => {
  const marketHistory = await serving({
    [iso(40)]: [row("vault:0x3", 50)], // outside a 30-day window
    [iso(2)]: [row("vault:0x3", 10)],
    [iso(1)]: [row("vault:0x3", 10)],
  });
  const h = await marketHistory("vault:0x3", 30);
  assert.equal(h.observations, 2, "the 50% day is outside the window");
  assert.equal(h.stats.max, 10);
});

test("an unreachable store is not a market with no history", async () => {
  // The distinction profile.js depends on: with no snapshots it reports
  // "too young to score". That has to be a statement about the market,
  // never about our own failure to read a file.
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  const marketHistory = await freshHistory();
  const h = await marketHistory("vault:0x4", 30);
  assert.equal(h.observations, 0);
  assert.ok(h.months_unreadable > 0, "a refused read must be counted, not zeroed");
  assert.match(h.note, /could not be read/);
});

test("a month with no file yet is not an unreadable month", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  const marketHistory = await freshHistory();
  const h = await marketHistory("vault:0x5", 30);
  assert.equal(h.observations, 0);
  assert.equal(h.months_unreadable, 0, "404 means the file does not exist yet");
  assert.match(h.note, /no snapshots yet/);
});
