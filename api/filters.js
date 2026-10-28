// Pure data shaping for the yields API — kept side-effect-free for testing.

export function mapPool(p, siteByProject = {}) {
  return {
    project: p.project,
    symbol: p.symbol,
    category: p.category || null,
    apy: Number(p.apy.toFixed(2)),
    apyBase: p.apyBase != null ? Number(p.apyBase.toFixed(2)) : null,
    apyReward: p.apyReward != null ? Number(p.apyReward.toFixed(2)) : null,
    tvlUsd: Math.round(p.tvlUsd),
    stablecoin: !!p.stablecoin,
    ilRisk: p.ilRisk,
    pool: p.pool,
    url: siteByProject[p.project] || `https://defillama.com/yields/pool/${p.pool}`,
    llamaUrl: `https://defillama.com/yields/pool/${p.pool}`,
  };
}

export function baseYields(data, siteByProject = {}) {
  return data
    .filter((p) => p.chain === "Base" && p.tvlUsd > 100_000 && p.apy > 0)
    .map((p) => mapPool(p, siteByProject))
    .sort((a, b) => b.tvlUsd - a.tvlUsd);
}

export function applyQuery(pools, { asset, project, stable, minTvl, sort } = {}) {
  let out = pools;
  if (asset) out = out.filter((p) => p.symbol.toUpperCase().includes(String(asset).toUpperCase()));
  if (project) out = out.filter((p) => p.project.includes(String(project).toLowerCase()));
  if (stable === "true" || stable === true) out = out.filter((p) => p.stablecoin);
  if (minTvl) out = out.filter((p) => p.tvlUsd >= Number(minTvl));
  if (sort === "apy") out = [...out].sort((a, b) => b.apy - a.apy);
  return out;
}

// Sanity filters keep degen farm traps out of agent-facing answers.
export function pickBest(pools, { asset = "ETH", minTvl = 1_000_000, includeLp = false } = {}) {
  const u = String(asset).toUpperCase();
  const eligible = pools.filter(
    (p) =>
      p.symbol.toUpperCase().includes(u) &&
      p.tvlUsd >= Number(minTvl) &&
      p.apy < 1000 &&
      (includeLp || p.ilRisk === "no")
  );
  if (!eligible.length) return null;
  return [...eligible].sort((a, b) => b.apy - a.apy)[0];
}
