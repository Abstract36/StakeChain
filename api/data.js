// Shared data layer: DefiLlama yields + Morpho vaults with in-memory caches.
// Used by the REST endpoints (server.js) and the hosted MCP endpoint (mcp.js).
import { baseYields } from "./filters.js";
import { fetchAaveReserves, asPoolRows } from "./aave.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const LLAMA_YIELDS_URL = "https://yields.llama.fi/pools";

export const cache = { at: 0, pools: [] };
let protocolUrls = { at: 0, map: {} };
export const vaultsCache = { at: 0, vaults: [] };

async function fetchProtocolUrls() {
  if (Date.now() - protocolUrls.at < 24 * 60 * 60 * 1000 && Object.keys(protocolUrls.map).length) {
    return protocolUrls.map;
  }
  try {
    const res = await fetch("https://api.llama.fi/protocols");
    if (res.ok) {
      const list = await res.json();
      const map = {};
      for (const p of list) if (p.slug && p.url) map[p.slug] = p.url;
      protocolUrls = { at: Date.now(), map };
    }
  } catch {
    // keep whatever we had; links fall back to the DefiLlama pool page
  }
  return protocolUrls.map;
}

export async function fetchBaseYields() {
  if (Date.now() - cache.at < CACHE_TTL_MS && cache.pools.length) {
    return cache.pools;
  }
  const res = await fetch(LLAMA_YIELDS_URL);
  if (!res.ok) throw new Error(`DefiLlama responded ${res.status}`);
  const { data } = await res.json();
  const siteByProject = await fetchProtocolUrls();
  let pools = baseYields(data, siteByProject);

  // DefiLlama's Aave rows on Base are unreliable (the $170M USDC reserve is
  // reported with zero TVL, which hides the best stablecoin rate on the
  // chain), so the curated reserves come from the Pool contract instead.
  try {
    const reserves = asPoolRows(await fetchAaveReserves());
    const covered = new Set(reserves.map((r) => r.symbol));
    pools = [...pools.filter((p) => !(p.project === "aave-v3" && covered.has(p.symbol))), ...reserves]
      .sort((a, b) => b.tvlUsd - a.tvlUsd);
  } catch {
    // RPC down: fall back to whatever the snapshot had
  }

  Object.assign(cache, { at: Date.now(), pools });
  return pools;
}

export const marketsCache = { at: 0, markets: [] };

// Borrow markets (Morpho Blue): collateral -> USDC, with the on-chain
// MarketParams needed to transact plus display metrics.
export async function fetchBaseMarkets() {
  if (Date.now() - marketsCache.at < CACHE_TTL_MS && marketsCache.markets.length) {
    return marketsCache.markets;
  }
  const query = `{
    markets(first: 20, where: { chainId_in: [8453], listed: true },
            orderBy: SupplyAssetsUsd, orderDirection: Desc) {
      items {
        marketId lltv irmAddress
        oracle { address }
        loanAsset { address symbol decimals }
        collateralAsset { address symbol decimals }
        state { borrowApy liquidityAssetsUsd }
      }
    }
  }`;
  const res = await fetch("https://blue-api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Morpho API ${res.status}`);
  const { data } = await res.json();
  const markets = (data?.markets?.items || [])
    .filter(
      (m) =>
        m.collateralAsset &&
        m.loanAsset.symbol === "USDC" &&
        (m.state?.liquidityAssetsUsd || 0) >= 1_000_000
    )
    .slice(0, 6)
    .map((m) => ({
      marketId: m.marketId,
      lltv: m.lltv,
      oracle: m.oracle.address,
      irm: m.irmAddress,
      loanAsset: m.loanAsset,
      collateralAsset: m.collateralAsset,
      borrowApy: Number(((m.state.borrowApy || 0) * 100).toFixed(2)),
      liquidityUsd: Math.round(m.state.liquidityAssetsUsd || 0),
    }));
  Object.assign(marketsCache, { at: Date.now(), markets });
  return markets;
}

// Raw, checkable facts about a Morpho vault — no judgement applied here;
// profile.js turns these into a score, and every number stays visible so
// the score can be recomputed rather than believed.
function vaultRisk(v) {
  const st = v.state || {};
  const alloc = (st.allocation || []).filter((a) => (a.supplyAssetsUsd || 0) > 0);
  const total = alloc.reduce((s, a) => s + (a.supplyAssetsUsd || 0), 0);
  const sorted = [...alloc].sort((a, b) => (b.supplyAssetsUsd || 0) - (a.supplyAssetsUsd || 0));
  const net = (st.netApy || 0) * 100;
  const base = (st.netApyExcludingRewards || 0) * 100;
  return {
    curatorFeePct: Number(((st.fee || 0) * 100).toFixed(1)),
    ageDays: v.creationTimestamp
      ? Math.floor((Date.now() / 1000 - Number(v.creationTimestamp)) / 86400)
      : null,
    // incentives can end; lending interest is what the borrowers pay
    apyFromInterest: Number(Math.min(base, net).toFixed(2)),
    apyFromIncentives: Number(Math.max(net - base, 0).toFixed(2)),
    marketCount: alloc.length,
    topAllocationPct: total ? Number(((sorted[0].supplyAssetsUsd / total) * 100).toFixed(1)) : null,
    topCollateral: sorted[0]?.market?.collateralAsset?.symbol || null,
    maxLltvPct: alloc.length
      ? Number(Math.max(...alloc.map((a) => Number(a.market?.lltv || 0) / 1e16)).toFixed(0))
      : null,
  };
}

export async function fetchBaseVaults() {
  if (Date.now() - vaultsCache.at < CACHE_TTL_MS && vaultsCache.vaults.length) {
    return vaultsCache.vaults;
  }
  const query = `{
    vaults(first: 50, where: { chainId_in: [8453], listed: true },
           orderBy: TotalAssetsUsd, orderDirection: Desc) {
      items {
        address symbol name creationTimestamp
        asset { address symbol decimals }
        state {
          netApy netApyExcludingRewards totalAssetsUsd fee
          allocation { supplyAssetsUsd market { lltv collateralAsset { symbol } } }
        }
      }
    }
  }`;
  const res = await fetch("https://blue-api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Morpho API ${res.status}`);
  const { data } = await res.json();
  const vaults = (data?.vaults?.items || [])
    // $500k keeps small-but-real vaults (the yields table links to them, so
    // a higher cut silently turned depositable rows into dead-end links)
    .filter((v) => (v.state?.totalAssetsUsd || 0) >= 500_000 && (v.state?.netApy || 0) > 0)
    .map((v) => ({
      address: v.address,
      symbol: v.symbol,
      name: v.name,
      asset: v.asset,
      apy: Number(((v.state.netApy || 0) * 100).toFixed(2)),
      tvlUsd: Math.round(v.state.totalAssetsUsd),
      protocol: "morpho",
      // ERC-4626: the vault itself is both the position token and the
      // deposit target; Aave entries override this with the Pool address
      depositTo: v.address,
      url: `https://app.morpho.org/base/vault/${v.address}`,
      // Facts a depositor should see next to the rate but rarely does:
      // what the curator keeps, how long this has run, how much of the
      // yield is lending interest rather than incentives, and whether the
      // money sits in one market or several.
      risk: vaultRisk(v),
    }));

  // Aave V3 reserves join the same shelf, read straight from the protocol
  let aave = [];
  try {
    aave = await fetchAaveReserves();
  } catch {
    // RPC down: still serve the Morpho vaults
  }

  const all = [...vaults, ...aave].sort((a, b) => b.tvlUsd - a.tvlUsd);
  Object.assign(vaultsCache, { at: Date.now(), vaults: all });
  return all;
}
