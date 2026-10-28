// Shared data layer: DefiLlama yields + Morpho vaults with in-memory caches.
// Used by the REST endpoints (server.js) and the hosted MCP endpoint (mcp.js).
import { baseYields } from "./filters.js";

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
  const pools = baseYields(data, siteByProject);
  Object.assign(cache, { at: Date.now(), pools });
  return pools;
}

export async function fetchBaseVaults() {
  if (Date.now() - vaultsCache.at < CACHE_TTL_MS && vaultsCache.vaults.length) {
    return vaultsCache.vaults;
  }
  const query = `{
    vaults(first: 20, where: { chainId_in: [8453], listed: true },
           orderBy: TotalAssetsUsd, orderDirection: Desc) {
      items {
        address symbol name
        asset { address symbol decimals }
        state { netApy totalAssetsUsd }
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
    .filter((v) => (v.state?.totalAssetsUsd || 0) >= 1_000_000 && (v.state?.netApy || 0) > 0)
    .map((v) => ({
      address: v.address,
      symbol: v.symbol,
      name: v.name,
      asset: v.asset,
      apy: Number(((v.state.netApy || 0) * 100).toFixed(2)),
      tvlUsd: Math.round(v.state.totalAssetsUsd),
      protocol: "morpho",
      url: `https://app.morpho.org/base/vault/${v.address}`,
    }));
  Object.assign(vaultsCache, { at: Date.now(), vaults });
  return vaults;
}
