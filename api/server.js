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
import { TIERS, issueKey, verifyKey } from "./subscriptions.js";
import { fetchPaymentStats } from "./stats.js";
import { coveredByUpstream, buyUpstream } from "./a2a.js";
import { marketHistory, historyIndex } from "./history.js";
import { marketBadge, statsBadge } from "./badge.js";

const PORT = process.env.PORT || 4000;

// x402 payment requirements (Base mainnet)
const X402_ENFORCE = process.env.X402_ENFORCE === "true";
const PAY_TO = process.env.PAY_TO || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PRICE_USDC = process.env.PRICE_USDC || "0.001"; // per machine request
const PRICE_ATOMIC = String(Math.round(parseFloat(PRICE_USDC) * 1e6));
// Signs subscription API keys (any long random string); unset = tiers off
const API_KEY_SECRET = process.env.API_KEY_SECRET;

const app = express();

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");
  next();
});

// Never charge for a chain we cannot answer: without a registered A2A
// upstream the request is refused before any payment is taken.
app.use((req, res, next) => {
  if (req.path === "/v1/yields") {
    const chain = String(req.query.chain || "base").toLowerCase();
    if (chain !== "base" && !coveredByUpstream(chain)) {
      return res.status(501).json({
        error: `chain "${chain}" not covered yet`,
        covered: ["base"],
        note: "other chains are resold from upstream x402 sellers as they register",
      });
    }
  }
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
  const cdpPaywall = paymentMiddleware(
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
        "GET /v1/subscribe/developer": {
          price: TIERS.developer.price,
          network: "base",
          config: {
            description:
              "Developer subscription: 30 days of /v1/* access via X-API-KEY instead of per-request payments",
            discoverable: true,
          },
        },
        "GET /v1/subscribe/professional": {
          price: TIERS.professional.price,
          network: "base",
          config: {
            description:
              "Professional subscription: 30 days of /v1/* access via X-API-KEY instead of per-request payments",
            discoverable: true,
          },
        },
      },
      createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET)
    );
  // Subscription keys skip the per-request paywall on data routes; buying a
  // subscription (/v1/subscribe/*) always goes through the x402 payment.
  app.use((req, res, next) => {
    if (req.path.startsWith("/v1/subscribe")) {
      // never let a payment settle if we can't issue the key afterwards
      if (!API_KEY_SECRET) {
        return res
          .status(503)
          .json({ error: "subscriptions not configured (API_KEY_SECRET missing)" });
      }
    } else {
      const sub = verifyKey(req.header("X-API-KEY"), API_KEY_SECRET);
      if (sub) {
        req.subscriber = sub;
        return next();
      }
    }
    return cdpPaywall(req, res, next);
  });
} else if (X402_ENFORCE) {
  const selfHosted = await createX402({
    rpc: process.env.BASE_RPC || "https://mainnet.base.org",
    chainId: 8453,
    network: "base",
    usdcAddress: USDC_BASE,
    payTo: PAY_TO,
    priceAtomic: PRICE_ATOMIC,
    relayerPk: process.env.RELAYER_PK,
    internalKey: process.env.X402_INTERNAL_KEY,
  });
  x402 = (req, res, next) => {
    const sub = verifyKey(req.header("X-API-KEY"), API_KEY_SECRET);
    if (sub) {
      req.subscriber = sub;
      return next();
    }
    return selfHosted(req, res, next);
  };
}

// --- routes -----------------------------------------------------------------

// Root: a human/agent-readable index of the service
app.get("/", (req, res) =>
  res.json({
    name: "StakeChain Yields API",
    description:
      "Base staking/lending yields for humans (free) and AI agents (x402 paid tier)",
    free: [
      "/health",
      "/stats",
      "/yields",
      "/vaults",
      "/markets",
      "/history?pool=<id>&days=30",
      "POST /mcp (MCP Streamable HTTP)",
    ],
    paid_x402: ["/v1/yields", "/v1/best?asset=ETH", "/v1/vaults"],
    price_per_request_usdc: PRICE_USDC,
    subscriptions: {
      developer: `${TIERS.developer.price}/30d — GET /v1/subscribe/developer (pay via x402, receive X-API-KEY)`,
      professional: `${TIERS.professional.price}/30d — GET /v1/subscribe/professional`,
    },
    docs: "https://github.com/Abstract36/StakeChain",
    website: "https://abstract36.github.io/StakeChain/",
  })
);

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
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    res.json({ updatedAt: cache.at, count: limit, pools: pools.slice(0, limit) });
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

// Subscription purchase: the x402 payment for the route price is the
// purchase; the response carries a signed 30-day API key. CDP mode only.
const subscribeHandler = (tier) => (req, res) => {
  if (!API_KEY_SECRET) {
    return res
      .status(503)
      .json({ error: "subscriptions not configured (API_KEY_SECRET missing)" });
  }
  let payer = "unknown";
  try {
    const payment = JSON.parse(
      Buffer.from(req.header("X-PAYMENT"), "base64").toString("utf8")
    );
    payer = payment.payload.authorization.from;
  } catch {}
  res.json({
    tier,
    apiKey: issueKey({ tier, payer }, API_KEY_SECRET),
    valid_days: TIERS[tier].days,
    fair_use: TIERS[tier].fairUse,
    usage: "send the key as an X-API-KEY header on /v1/* requests",
  });
};
const requireCdp = (req, res, next) =>
  CDP_MODE ? next() : res.status(503).json({ error: "subscriptions require the CDP payment mode" });
app.get("/v1/subscribe/developer", requireCdp, subscribeHandler("developer"));
app.get("/v1/subscribe/professional", requireCdp, subscribeHandler("professional"));

// Free endpoint: public, on-chain-verifiable payment/revenue stats.
app.get("/stats", async (req, res) => {
  try {
    const data = await fetchPaymentStats({
      payTo: PAY_TO,
      usdc: USDC_BASE,
      apiKey: process.env.ETHERSCAN_API_KEY,
      knownAmounts: [PRICE_ATOMIC, "19000000", "99000000"],
    });
    res.json({
      service: "StakeChain x402 payments — public stats",
      pricing: {
        per_request_usdc: PRICE_USDC,
        subscriptions: {
          developer: TIERS.developer.price + "/30d",
          professional: TIERS.professional.price + "/30d",
        },
      },
      ...data,
    });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// Free endpoint: embeddable SVG badges. Served with a short cache window —
// GitHub proxies images through camo, which honours it — and it always
// renders something, because a broken image in someone's README is worse
// than a stale rate.
app.get("/badge/:slug.svg", async (req, res) => {
  res.set("Content-Type", "image/svg+xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
  try {
    if (req.params.slug === "stats") {
      const s = await fetchPaymentStats({
        payTo: PAY_TO,
        usdc: USDC_BASE,
        knownAmounts: [PRICE_ATOMIC, "19000000", "99000000"],
      });
      return res.send(
        statsBadge({
          payments: s.all_time.payments,
          external: s.all_time.payments - s.all_time.internal_payments,
        })
      );
    }
    res.send(
      await marketBadge(req.params.slug, {
        label: req.query.label,
        kind: String(req.query.kind || "apy"),
      })
    );
  } catch {
    res.send(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20"></svg>'
    );
  }
});

// Free endpoint: rate history. `pool` is a DefiLlama pool id, one of our
// own ids (aave-v3-base-usdc) or vault:<address>; without it, what the
// dataset covers.
app.get("/history", async (req, res) => {
  try {
    if (!req.query.pool) return res.json(await historyIndex());
    const days = Math.min(Number(req.query.days) || 30, 365);
    res.json(await marketHistory(String(req.query.pool), days));
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
// ?chain=<other> is resold from another x402 seller when one is registered
// (A2A): we pay the upstream on-chain and pass the data through.
app.get("/v1/yields", x402, async (req, res) => {
  try {
    const chain = String(req.query.chain || "base").toLowerCase();
    if (chain !== "base") {
      if (!coveredByUpstream(chain)) {
        return res.status(501).json({
          error: `chain "${chain}" not covered yet`,
          covered: ["base"],
          note: "other chains are resold from upstream x402 sellers as they register",
        });
      }
      const { status, body } = await buyUpstream(chain, new URLSearchParams(req.query).toString());
      return res.status(status).json(body);
    }
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
