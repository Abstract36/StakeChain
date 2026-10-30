// Market profile: the facts a depositor should weigh next to the rate,
// and a score derived from them by a formula printed in the response.
//
// Deliberately not a model. Every input is observable, every weight is
// stated, and the arithmetic is simple enough to redo by hand — a score
// you cannot recompute is a score you have to trust, and this project
// does not ask for trust anywhere else either.
//
// A signal with no data (stability before enough snapshots exist) is
// reported as unknown and dropped from the weighting, rather than being
// guessed at and quietly dragging the result.
import { fetchBaseVaults } from "./data.js";
import { marketHistory } from "./history.js";

export const WEIGHTS = {
  size: 25, // how much can leave without moving the market
  track_record: 20, // how long it has run
  stability: 20, // how much the rate has moved (our own snapshots)
  yield_quality: 15, // lending interest vs incentives that can stop
  cost: 10, // what the curator or protocol keeps
  diversification: 10, // one market or several
  exit_liquidity: 10, // can a depositor actually leave
};

const clamp = (n) => Math.max(0, Math.min(100, n));
const band = (score) =>
  score >= 80 ? "solid" : score >= 60 ? "fair" : score >= 40 ? "thin" : "fragile";

function signals(market, history) {
  const r = market.risk || {};
  const out = {};

  // $500k scores 0, $500M scores 100, log-scaled in between
  out.size = {
    value: market.tvlUsd,
    unit: "USD",
    score: clamp(((Math.log10(Math.max(market.tvlUsd, 1)) - 5.7) / (8.7 - 5.7)) * 100),
    note: "deposits in the market — how much can exit without moving the rate",
  };

  if (r.ageDays != null) {
    out.track_record = {
      value: r.ageDays,
      unit: "days",
      score: clamp((r.ageDays / 365) * 100),
      note: "a year of operation scores full marks",
    };
  }

  if (history && history.observations >= 5) {
    const vol = history.stats.volatility;
    out.stability = {
      value: vol,
      unit: "APY stdev, pp",
      score: clamp(100 - (vol / 5) * 100),
      note: `over ${history.observations} daily snapshots; 5pp of swing scores zero`,
    };
  } else {
    out.stability = {
      value: null,
      score: null,
      note: `needs 5 daily snapshots, have ${history?.observations || 0} — excluded from the score`,
    };
  }

  if (r.apyFromInterest != null && market.apy > 0) {
    const share = (r.apyFromInterest / market.apy) * 100;
    out.yield_quality = {
      value: Number(share.toFixed(1)),
      unit: "% of APY from lending interest",
      score: clamp(share),
      note:
        r.apyFromIncentives > 0
          ? `${r.apyFromIncentives}pp comes from incentives, which can stop`
          : "all of it is interest paid by borrowers",
    };
  }

  if (r.curatorFeePct != null) {
    out.cost = {
      value: r.curatorFeePct,
      unit: `% of yield to the ${r.curatorLabel || "curator"}`,
      score: clamp(100 - r.curatorFeePct * 4), // 25% fee scores zero
      note: "taken before the rate you see",
    };
  }

  // A rate is high partly because the money is lent out — at 98% borrowed
  // the exit is narrow until someone repays, which belongs next to the APY
  // rather than in a footnote.
  if (r.utilizationPct != null) {
    out.exit_liquidity = {
      value: r.utilizationPct,
      unit: "% of deposits currently lent out",
      score: clamp((100 - r.utilizationPct) * 2.5),
      note:
        r.freeLiquidityUsd != null
          ? r.utilizationPct >= 95
            ? `only ~$${r.freeLiquidityUsd.toLocaleString("en-US")} can be withdrawn right now — the rest waits for borrowers to repay`
            : `~$${r.freeLiquidityUsd.toLocaleString("en-US")} free to withdraw against`
          : r.utilizationPct >= 95
          ? "almost fully lent: a large withdrawal may have to wait for repayments"
          : "free liquidity available to withdraw against",
    };
  }

  if (r.topAllocationPct != null) {
    out.diversification = {
      value: r.topAllocationPct,
      unit: "% in the largest position",
      score: clamp((100 - r.topAllocationPct) * 2),
      note: `${r.marketCount} market(s), largest backed by ${r.topCollateral}`,
    };
  }

  return out;
}

export async function marketProfile(slug, { days = 30 } = {}) {
  const vaults = await fetchBaseVaults();
  const want = String(slug).toLowerCase().replace(/^vault[-:]/, "");
  const market = vaults.find(
    (v) =>
      v.address.toLowerCase() === want ||
      v.symbol.toLowerCase() === want ||
      `${v.protocol}-${v.asset.symbol}`.toLowerCase() === want
  );
  if (!market) return null;

  const history = await marketHistory(`vault:${market.address.toLowerCase()}`, days).catch(
    () => null
  );
  const sig = signals(market, history);

  // weighted mean over the signals that have data
  const used = Object.entries(sig).filter(([, s]) => s.score != null);
  const weight = used.reduce((s, [k]) => s + (WEIGHTS[k] || 0), 0);
  const score = weight
    ? Math.round(used.reduce((s, [k, v]) => s + v.score * (WEIGHTS[k] || 0), 0) / weight)
    : null;

  return {
    market: market.name || market.symbol,
    id: `vault:${market.address.toLowerCase()}`,
    protocol: market.protocol,
    asset: market.asset.symbol,
    apy: market.apy,
    tvlUsd: market.tvlUsd,
    score,
    band: score == null ? null : band(score),
    signals: sig,
    method: {
      weights: WEIGHTS,
      applied: Object.fromEntries(used.map(([k]) => [k, WEIGHTS[k]])),
      formula:
        "score = sum(signal.score * weight) / sum(weight), over signals with data. " +
        "Every input is in `signals`, so the number can be recomputed rather than trusted.",
      caveat:
        "Describes what has happened, not what will. A high score is not a recommendation.",
    },
  };
}

/** Compact form for list views: the score plus the facts that drive it. */
export function compactProfile(market) {
  const r = market.risk;
  if (!r) return null;
  return {
    curatorFeePct: r.curatorFeePct,
    ageDays: r.ageDays,
    topAllocationPct: r.topAllocationPct,
    incentiveSharePct:
      market.apy > 0 ? Number(((r.apyFromIncentives / market.apy) * 100).toFixed(1)) : 0,
  };
}
