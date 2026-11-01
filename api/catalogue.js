// One description of what this service sells, read by three consumers:
// the x402 paywall, the Bazaar declaration, and the discovery documents at
// /.well-known/x402 and /openapi.json.
//
// They are generated from this file rather than written alongside it,
// because a catalogue that drifts from the service is worse than none: an
// agent that follows a stale document pays for a route that moved, or
// skips one that exists. Everything an outside reader can learn about the
// paid shelf is derived here.

const str = { type: "string" };
const num = { type: "number" };
const nullableNum = { type: ["number", "null"] };

export const SOURCE_STATUS = {
  type: "object",
  description:
    "which upstreams answered; a protocol marked unreachable is absent from the rows, not empty in reality",
  additionalProperties: { type: "string", enum: ["ok", "unreachable"] },
};

// Provenance travels with every row, so `required` must promise it too: a
// declared contract that omits the fields the service is sold on is the
// same gap as having no contract at all.
const PROVENANCE = {
  source: { type: "string", enum: ["onchain", "morpho-api", "defillama"] },
  block: { type: ["integer", "null"] },
  observedAt: num,
};

export const POOL = {
  type: "object",
  properties: {
    ...PROVENANCE,
    project: str, symbol: str, pool: str, url: str, llamaUrl: str,
    ilRisk: str, category: { type: ["string", "null"] },
    apy: num, apyBase: nullableNum, apyReward: nullableNum,
    tvlUsd: num, stablecoin: { type: "boolean" },
  },
  // `required` lists the fields measured present and non-null on every row
  // of a live response, not every field we happen to send.
  required: ["source", "block", "observedAt", "project", "symbol", "pool", "apy",
             "tvlUsd", "stablecoin", "ilRisk", "url", "llamaUrl"],
};

export const VAULT = {
  type: "object",
  properties: {
    ...PROVENANCE,
    address: str, symbol: str, name: str, protocol: str, depositTo: str, url: str,
    apy: num, tvlUsd: num, caption: str,
    asset: {
      type: "object",
      properties: { address: str, symbol: str, decimals: { type: "integer" } },
      required: ["address", "symbol", "decimals"],
    },
    risk: {
      type: "object",
      properties: {
        curatorFeePct: num, ageDays: num, apyFromInterest: num, apyFromIncentives: num,
        marketCount: num, topAllocationPct: num, topCollateral: str, maxLltvPct: num,
      },
      required: ["curatorFeePct", "ageDays", "apyFromInterest", "apyFromIncentives",
                 "marketCount", "topAllocationPct", "topCollateral"],
    },
  },
  required: ["source", "block", "observedAt", "address", "symbol", "name", "protocol",
             "depositTo", "apy", "tvlUsd", "asset", "risk", "url"],
};

export const listOf = (item, key, extra = {}) => ({
  type: "object",
  properties: {
    updatedAt: num,
    sources: SOURCE_STATUS,
    count: { type: "integer" },
    ...extra,
    [key]: { type: "array", items: item },
  },
  required: ["updatedAt", "sources", "count", key],
});

export const SUBSCRIPTION = {
  type: "object",
  properties: { tier: str, apiKey: str, valid_days: { type: "integer" }, fair_use: num, usage: str },
  required: ["tier", "apiKey", "valid_days", "usage"],
};

/** The paid shelf. `price` is a display string; `atomic` is what settles. */
export function paidRoutes({ priceUsdc, tiers }) {
  return [
    {
      method: "GET",
      path: "/v1/yields",
      price: `$${priceUsdc}`,
      description:
        "Complete Base staking and lending dataset: APY, TVL and project per pool, " +
        "with junk-farm filters. Aave and Moonwell rates read from their own contracts.",
      tags: ["defi", "yields", "lending", "base"],
      discovery: {
        input: { asset: "USDC", stable: "true", minTvl: "1000000", sort: "apy" },
        output: {
          example: {
            updatedAt: 1793000000000,
            count: 1,
            pools: [{
              project: "morpho-blue", symbol: "SPARKUSDC", apy: 8.13,
              tvlUsd: 450000000, stablecoin: true,
              pool: "a5fab52f-73fa-4f44-9c09-9af1eb20996c",
            }],
          },
          schema: listOf(POOL, "pools", { total: { type: "integer" } }),
        },
      },
    },
    {
      method: "GET",
      path: "/v1/best",
      price: `$${priceUsdc}`,
      description: "Highest-APY pool on Base for one asset, junk-farm filters applied",
      tags: ["defi", "yields", "base"],
      discovery: {
        input: { asset: "USDC" },
        output: {
          example: { asset: "USDC", best: { project: "morpho-blue", apy: 9.2 } },
          schema: {
            type: "object",
            properties: { updatedAt: num, sources: SOURCE_STATUS, asset: str, best: POOL },
            required: ["updatedAt", "sources", "asset", "best"],
          },
        },
      },
    },
    {
      method: "GET",
      path: "/v1/vaults",
      price: `$${priceUsdc}`,
      description: "Deposit-ready Base lending markets with the contract address to deposit into",
      tags: ["defi", "lending", "vaults", "base"],
      discovery: {
        output: {
          example: {
            count: 1,
            vaults: [{
              name: "Spark USDC Vault", protocol: "morpho", apy: 8.13, tvlUsd: 450000000,
              depositTo: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
              asset: { symbol: "USDC", decimals: 6 },
            }],
          },
          schema: listOf(VAULT, "vaults"),
        },
      },
    },
    {
      method: "GET",
      path: "/v1/subscribe/developer",
      price: tiers.developer.price,
      description: "Developer subscription: 30 days of /v1/* access via X-API-KEY",
      tags: ["subscription", "defi"],
      discovery: {
        output: {
          example: { tier: "developer", apiKey: "<signed key>", valid_days: 30 },
          schema: SUBSCRIPTION,
        },
      },
    },
    {
      method: "GET",
      path: "/v1/subscribe/professional",
      price: tiers.professional.price,
      description: "Professional subscription: 30 days of /v1/* access via X-API-KEY",
      tags: ["subscription", "defi"],
      discovery: {
        output: {
          example: { tier: "professional", apiKey: "<signed key>", valid_days: 30 },
          schema: SUBSCRIPTION,
        },
      },
    },
  ];
}

/** The free shelf: no key, no payment, no rate limit yet. */
export const freeRoutes = [
  { method: "GET", path: "/yields", description: "Base yields, top 100, with the same filters as the paid route", query: { asset: "USDC", stable: "true", minTvl: "1000000", sort: "apy", limit: "100" } },
  { method: "GET", path: "/vaults", description: "Deposit-ready lending markets with contract addresses and a risk block" },
  { method: "GET", path: "/markets", description: "Morpho Blue markets: borrow APY and available liquidity" },
  { method: "GET", path: "/history", description: "Daily APY and TVL series for one market, with volatility", query: { pool: "vault:0x7bfa7c4f149e7415b73bdedfe609237e29cbf34a", days: "30" } },
  { method: "GET", path: "/profile", description: "Risk profile for one market: size, age, stability, curator fee, concentration, with the weights printed so the score can be recomputed", query: { pool: "sparkusdc" } },
  { method: "GET", path: "/execute", description: "Unsigned calldata to deposit into or exit a market: approve plus deposit, across Morpho, Aave, Moonwell and this project's staking", query: { pool: "sparkusdc", amount: "25.5", from: "0x0000000000000000000000000000000000000000", action: "deposit" } },
  { method: "GET", path: "/stats", description: "On-chain-verifiable payment and revenue figures for this API" },
  { method: "POST", path: "/mcp", description: "Hosted MCP endpoint (Streamable HTTP): the same six tools as the npm package" },
];
