// StakeChain Yields API — aggregates staking/LST/lending yields on Base.
// Data source: DefiLlama public yields API (free), cached in memory.
//
// Monetization model (x402): human traffic via the dashboard is free;
// machine consumers (AI agents, bots, integrators) pay per request in USDC
// on Base using the x402 protocol (HTTP 402 + X-PAYMENT header).
// Revenue flows directly to the admin wallet — no intermediaries.
//
// While the experiment runs, enforcement is off (X402_ENFORCE=false):
// the 402 flow is advertised but requests are served for free, so agents
// can integrate early. Flip X402_ENFORCE=true to start charging.

import express from "express";
import { baseYields, applyQuery, pickBest } from "./filters.js";

const PORT = process.env.PORT || 4000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const LLAMA_YIELDS_URL = "https://yields.llama.fi/pools";

// x402 payment requirements (Base mainnet)
const X402_ENFORCE = process.env.X402_ENFORCE === "true";
const PAY_TO = process.env.PAY_TO || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PRICE_USDC = process.env.PRICE_USDC || "0.001"; // per machine request

const app = express();

// --- data layer -------------------------------------------------------------

let cache = { at: 0, pools: [] };
// protocol slug -> official site URL (the /pools endpoint has no links)
let protocolUrls = { at: 0, map: {} };

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

async function fetchBaseYields() {
  if (Date.now() - cache.at < CACHE_TTL_MS && cache.pools.length) {
    return cache.pools;
  }
  const res = await fetch(LLAMA_YIELDS_URL);
  if (!res.ok) throw new Error(`DefiLlama responded ${res.status}`);
  const { data } = await res.json();
  const siteByProject = await fetchProtocolUrls();

  const pools = baseYields(data, siteByProject);
  cache = { at: Date.now(), pools };
  return pools;
}

// --- Morpho vaults (lend side) -----------------------------------------------

let vaultsCache = { at: 0, vaults: [] };

async function fetchBaseVaults() {
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
  vaultsCache = { at: Date.now(), vaults };
  return vaults;
}

// --- x402 paywall -----------------------------------------------------------

// Machine endpoints respond 402 with payment requirements until the caller
// retries with a valid X-PAYMENT header. Verification/settlement is delegated
// to an x402 facilitator when enforcement is on.
function x402(req, res, next) {
  if (!X402_ENFORCE) return next();
  const payment = req.header("X-PAYMENT");
  if (!payment) {
    return res.status(402).json({
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: PRICE_USDC,
          asset: USDC_BASE,
          payTo: PAY_TO,
          resource: req.originalUrl,
          description: "StakeChain Base yields data (per-request)",
        },
      ],
    });
  }
  // TODO(x402): verify+settle via facilitator before serving.
  // See https://x402.org — until wired, enforcement must stay off in prod.
  return next();
}

// --- routes -----------------------------------------------------------------

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");
  next();
});

app.get("/health", (req, res) => res.json({ ok: true, cachedAt: cache.at }));

// Free endpoint: curated top-N for the public dashboard.
app.get("/yields", async (req, res) => {
  try {
    const pools = await fetchBaseYields();
    res.json({ updatedAt: cache.at, count: 25, pools: pools.slice(0, 25) });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Free endpoint: curated ERC-4626 lending vaults on Base (Morpho) for the
// dashboard's Earn scene — deposits go straight to the audited vaults.
app.get("/vaults", async (req, res) => {
  try {
    const vaults = await fetchBaseVaults();
    res.json({ updatedAt: vaultsCache.at, count: vaults.length, vaults });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Machine endpoint (x402): same vaults data for AI agents.
app.get("/v1/vaults", x402, async (req, res) => {
  try {
    const vaults = await fetchBaseVaults();
    res.json({ updatedAt: vaultsCache.at, count: vaults.length, vaults });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Machine endpoint (x402): full dataset + filters, built for AI agents.
app.get("/v1/yields", x402, async (req, res) => {
  try {
    const pools = applyQuery(await fetchBaseYields(), req.query);
    res.json({ updatedAt: cache.at, count: pools.length, pools });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Machine endpoint (x402): single best option for an asset.
app.get("/v1/best", x402, async (req, res) => {
  try {
    const asset = String(req.query.asset || "ETH").toUpperCase();
    const best = pickBest(await fetchBaseYields(), {
      asset,
      minTvl: req.query.minTvl,
      includeLp: req.query.includeLp === "true",
    });
    if (!best) return res.status(404).json({ error: `no pools for ${asset}` });
    res.json({ updatedAt: cache.at, asset, best });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Run a listener only when launched directly (node server.js);
// serverless hosts (Vercel) import the exported app instead.
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`StakeChain yields API on :${PORT} (x402 enforce: ${X402_ENFORCE})`);
  });
}

export default app;
