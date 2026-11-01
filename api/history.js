// Serves the rate history collected by scripts/snapshot.js.
//
// The snapshots live in the public repo rather than in a database: the data
// is then verifiable by anyone, survives any hosting change, and the API
// stays stateless. Files are fetched from raw.githubusercontent and cached
// in memory (a month file is a few hundred KB and changes once a day).
const RAW =
  process.env.HISTORY_BASE ||
  "https://raw.githubusercontent.com/Abstract36/StakeChain/main/data/history";
const TTL_MS = 30 * 60 * 1000;

const cache = new Map(); // month -> { at, store }

/**
 * Returns the month's store, or a marker saying we could not read it.
 *
 * A 404 and a 503 are not the same fact: the first means the month has no
 * file yet, the second means we failed to look. Collapsing them made an
 * unreachable snapshot store indistinguishable from a market with no
 * history, and `profile.js` then told the buyer the market was too young
 * to score — a statement about the market, from a failure of ours.
 */
async function month(name) {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.store;
  let res;
  try {
    res = await fetch(`${RAW}/${name}.json`);
  } catch {
    return { unreadable: true };
  }
  if (res.status === 404) return null; // no file for this month yet
  if (!res.ok) return { unreadable: true };
  const store = await res.json();
  cache.set(name, { at: Date.now(), store });
  return store;
}

const monthsBack = (days) => {
  const out = new Set();
  for (let i = 0; i <= days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    out.add(d.toISOString().slice(0, 7));
  }
  return [...out];
};

const quantile = (sorted, q) => {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
};

/**
 * Time series for one market plus the stability figures an allocator
 * actually needs: how far the rate has ranged, and how much of the period
 * it was above the level advertised today.
 */
export async function marketHistory(id, days = 30) {
  const fetched = (await Promise.all(monthsBack(days).map(month))).filter(Boolean);
  const unreadable = fetched.filter((s) => s.unreadable).length;
  const stores = fetched.filter((s) => !s.unreadable);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const series = [];
  let label = null;
  for (const store of stores) {
    for (const [date, rows] of Object.entries(store.days)) {
      if (date < cutoff) continue;
      const row = rows.find((r) => r.id === id);
      if (!row) continue;
      label = { project: row.project, symbol: row.symbol };
      series.push({ date, apy: row.apy, tvlUsd: row.tvlUsd });
    }
  }
  series.sort((a, b) => a.date.localeCompare(b.date));

  if (!series.length) {
    return {
      id,
      days,
      observations: 0,
      series: [],
      months_unreadable: unreadable,
      note: unreadable
        ? `${unreadable} month file(s) could not be read — this is not evidence that the market has no history`
        : "no snapshots yet for this market",
    };
  }

  const apys = series.map((s) => s.apy).sort((a, b) => a - b);
  const mean = apys.reduce((s, v) => s + v, 0) / apys.length;
  const sd = Math.sqrt(apys.reduce((s, v) => s + (v - mean) ** 2, 0) / apys.length);
  const current = series[series.length - 1].apy;

  return {
    id,
    ...label,
    days,
    observations: series.length,
    // A window where some months failed to load is a partial reading, and
    // the stats below are computed over what we got, not over the period.
    months_unreadable: unreadable,
    current_apy: current,
    stats: {
      min: apys[0],
      median: Number(quantile(apys, 0.5).toFixed(2)),
      max: apys[apys.length - 1],
      mean: Number(mean.toFixed(2)),
      // how much the rate swings; a high number means today's APY says
      // little about tomorrow's
      volatility: Number(sd.toFixed(2)),
      // share of observed days at or above the rate shown today
      days_at_or_above_current: series.filter((s) => s.apy >= current).length,
      tvl_min: Math.min(...series.map((s) => s.tvlUsd)),
      tvl_max: Math.max(...series.map((s) => s.tvlUsd)),
    },
    series,
  };
}

/** What the dataset currently covers. */
export async function historyIndex() {
  const res = await fetch(`${RAW}/index.json`);
  if (!res.ok) return { schema: 1, months: [], markets: 0, note: "no snapshots yet" };
  return res.json();
}
