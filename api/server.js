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

async function fetchBaseYields() {
  if (Date.now() - cache.at < CACHE_TTL_MS && cache.pools.length) {
    return cache.pools;
  }
  const res = await fetch(LLAMA_YIELDS_URL);
  if (!res.ok) throw new Error(`DefiLlama responded ${res.status}`);
  const { data } = await res.json();

  const pools = data
    .filter((p) => p.chain === "Base" && p.tvlUsd > 100_000 && p.apy > 0)
    .map((p) => ({
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
      url: p.url || `https://defillama.com/yields/pool/${p.pool}`,
    }))
    .sort((a, b) => b.tvlUsd - a.tvlUsd);

  cache = { at: Date.now(), pools };
  return pools;
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

// Machine endpoint (x402): full dataset + filters, built for AI agents.
app.get("/v1/yields", x402, async (req, res) => {
  try {
    let pools = await fetchBaseYields();
    const { asset, project, stable, minTvl, sort } = req.query;
    if (asset) pools = pools.filter((p) => p.symbol.toUpperCase().includes(String(asset).toUpperCase()));
    if (project) pools = pools.filter((p) => p.project.includes(String(project).toLowerCase()));
    if (stable === "true") pools = pools.filter((p) => p.stablecoin);
    if (minTvl) pools = pools.filter((p) => p.tvlUsd >= Number(minTvl));
    if (sort === "apy") pools = [...pools].sort((a, b) => b.apy - a.apy);
    res.json({ updatedAt: cache.at, count: pools.length, pools });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Machine endpoint (x402): single best option for an asset.
// Sanity filters keep degen farm traps out of agent-facing answers:
// minimum TVL (default $1M, overridable) and an APY ceiling of 1000%.
app.get("/v1/best", x402, async (req, res) => {
  try {
    const asset = String(req.query.asset || "ETH").toUpperCase();
    const minTvl = Number(req.query.minTvl || 1_000_000);
    // single-sided only by default; LP farms carry impermanent loss
    const includeLp = req.query.includeLp === "true";
    const pools = (await fetchBaseYields()).filter(
      (p) =>
        p.symbol.toUpperCase().includes(asset) &&
        p.tvlUsd >= minTvl &&
        p.apy < 1000 &&
        (includeLp || p.ilRisk === "no")
    );
    if (!pools.length) return res.status(404).json({ error: `no pools for ${asset}` });
    const best = [...pools].sort((a, b) => b.apy - a.apy)[0];
    res.json({ updatedAt: cache.at, asset, best });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`StakeChain yields API on :${PORT} (x402 enforce: ${X402_ENFORCE})`);
});
