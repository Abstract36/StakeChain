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
import { applyQuery, pickBest } from "./filters.js";
import { createX402 } from "./x402.js";
import { fetchBaseYields, fetchBaseVaults, cache, vaultsCache } from "./data.js";
import { handleMcp } from "./mcp.js";

const PORT = process.env.PORT || 4000;

// x402 payment requirements (Base mainnet)
const X402_ENFORCE = process.env.X402_ENFORCE === "true";
const PAY_TO = process.env.PAY_TO || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PRICE_USDC = process.env.PRICE_USDC || "0.001"; // per machine request

const app = express();

// --- x402 paywall -----------------------------------------------------------

// Self-hosted verify+settle (api/x402.js): EIP-3009 signature checked and
// submitted on-chain by our relayer. Off = everything free (bootstrap mode).
let x402 = (req, res, next) => next();
if (X402_ENFORCE) {
  x402 = await createX402({
    rpc: process.env.BASE_RPC || "https://mainnet.base.org",
    chainId: 8453,
    network: "base",
    usdcAddress: USDC_BASE,
    payTo: PAY_TO,
    priceAtomic: String(Math.round(parseFloat(PRICE_USDC) * 1e6)),
    relayerPk: process.env.RELAYER_PK,
    internalKey: process.env.X402_INTERNAL_KEY,
  });
}

// --- routes -----------------------------------------------------------------

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");
  next();
});

app.get("/health", (req, res) => res.json({ ok: true, cachedAt: cache.at }));

// Hosted MCP endpoint (Streamable HTTP, stateless) — free distribution lane
app.post("/mcp", express.json({ limit: "1mb" }), handleMcp);
app.all("/mcp", (req, res) =>
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed: stateless server, POST only" },
    id: null,
  })
);

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
