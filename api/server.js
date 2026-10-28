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
import { fetchBaseYields, fetchBaseVaults, fetchBaseMarkets, cache, vaultsCache, marketsCache } from "./data.js";
import { handleMcp } from "./mcp.js";

const PORT = process.env.PORT || 4000;

// x402 payment requirements (Base mainnet)
const X402_ENFORCE = process.env.X402_ENFORCE === "true";
const PAY_TO = process.env.PAY_TO || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PRICE_USDC = process.env.PRICE_USDC || "0.001"; // per machine request

const app = express();

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");
  next();
});

// --- x402 paywall -----------------------------------------------------------

// Two modes, both gated on X402_ENFORCE:
//  - CDP facilitator (CDP_API_KEY_ID + CDP_API_KEY_SECRET set): official
//    x402-express middleware settling through Coinbase; discoverable routes
//    get listed in the x402 Bazaar automatically.
//  - Self-hosted fallback (api/x402.js): EIP-3009 signature checked and
//    submitted on-chain by our relayer. Off = everything free (bootstrap mode).
let x402 = (req, res, next) => next();
const CDP_MODE =
  X402_ENFORCE && process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET;
if (CDP_MODE) {
  const { paymentMiddleware } = await import("x402-express");
  const { createFacilitatorConfig } = await import("@coinbase/x402");
  const route = (description, inputSchema) => ({
    price: `$${PRICE_USDC}`,
    network: "base",
    config: { description, discoverable: true, ...(inputSchema && { inputSchema }) },
  });
  app.use(
    paymentMiddleware(
      PAY_TO,
      {
        "GET /v1/yields": route(
          "Live Base staking/lending yields (APY, TVL, project) with junk-farm filters",
          {
            queryParams: {
              asset: "filter by asset symbol, e.g. ETH or USDC",
              project: "filter by project slug",
              stable: "true = stablecoin pools only",
              minTvl: "minimum TVL in USD",
              sort: "apy = sort by APY descending",
            },
          }
        ),
        "GET /v1/best": route(
          "Single best yield on Base for an asset (junk-farm filters built in)",
          {
            queryParams: {
              asset: "asset symbol, default ETH",
              minTvl: "minimum TVL in USD, default 1000000",
              includeLp: "true to include LP pools with IL risk",
            },
          }
        ),
        "GET /v1/vaults": route(
          "Curated ERC-4626 lending vaults on Base (Morpho), deposit-ready"
        ),
      },
      createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET)
    )
  );
} else if (X402_ENFORCE) {
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

// Free endpoint: Morpho Blue borrow markets (collateral -> USDC) for the
// dashboard's Borrow scene, with on-chain MarketParams.
app.get("/markets", async (req, res) => {
  try {
    const markets = await fetchBaseMarkets();
    res.json({ updatedAt: marketsCache.at, count: markets.length, markets });
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
