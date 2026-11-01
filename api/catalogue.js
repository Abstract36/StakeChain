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

/**
 * Settlement amounts differ by route, one atomic unit apart, so that a
 * USDC transfer on Base names the route it bought.
 *
 * Nothing else carries that. The request path exists only in a runtime log,
 * which this plan keeps for an hour; the transfer is permanent and readable
 * by anyone with the wallet address. Before this, all three per-request
 * routes charged the same amount, so the chain recorded eighteen payments
 * and could not say what any of them were for.
 *
 * `/v1/best` deliberately keeps the base amount. It is the only route the
 * CDP discovery index carries, and a cached entry there quotes the amount
 * it was indexed with — moving it would make our one working discovery
 * path unpayable until the catalogue refreshes, which it has not done since
 * it first ingested us. The cost to a buyer of the other two routes is
 * 0.000002 USDC.
 */
export const ROUTE_TAG = {
  "/v1/best": 0,
  "/v1/yields": 1,
  "/v1/vaults": 2,
};

/**
 * The base amount is the ambiguous one: every per-request route charged it
 * before the tags existed, so an older transfer at that amount could be any
 * of the three. A payment at or after this block can be attributed; before
 * it, the base amount is reported as unattributed rather than guessed.
 *
 * Set ahead of the deploy on purpose. Too high understates `/v1/best` for a
 * while; too low would label older payments with a route they may not have
 * bought, and a wrong number that looks precise is worse than an absent one.
 */
export const TAGGED_FROM_BLOCK = Number(process.env.ROUTE_TAGS_FROM_BLOCK || 53_420_000);

/** Atomic USDC (6 decimals) as the number a price list shows. */
export const usdFromAtomic = (atomic) => {
  const s = String(atomic).padStart(7, "0");
  const frac = s.slice(-6).replace(/0+$/, "");
  return frac ? `${s.slice(0, -6)}.${frac}` : s.slice(0, -6);
};

const atomicFromUsd = (usd) =>
  String(Math.round(parseFloat(String(usd).replace(/^\$/, "")) * 1e6));

/**
 * The paid shelf. `price` is a display string; `atomic` is what settles.
 *
 * `discovery.output.schema` is the name `declareDiscoveryExtension` takes,
 * not the path it serves. On the wire the SDK nests it under
 * `extensions.bazaar.schema.properties.output.properties.example`, while
 * `extensions.bazaar.info.output` carries only `{type, example}`. A reader
 * looking for `info.output.schema` finds nothing and concludes there is no
 * contract — which is how we came to describe our own declaration wrongly
 * in public.
 */
export function paidRoutes({ priceUsdc, priceAtomic, tiers }) {
  const base = BigInt(priceAtomic ?? atomicFromUsd(priceUsdc));
  // Display price derived from the amount that settles, never the other way
  // round: a price list that rounds to something the paywall will not accept
  // is a route nobody can buy.
  const perRequest = (path) => {
    const atomic = String(base + BigInt(ROUTE_TAG[path] ?? 0));
    return { atomic, price: `$${usdFromAtomic(atomic)}` };
  };
  return [
    {
      method: "GET",
      path: "/v1/yields",
      ...perRequest("/v1/yields"),
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
      ...perRequest("/v1/best"),
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
      ...perRequest("/v1/vaults"),
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
      atomic: atomicFromUsd(tiers.developer.price),
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
      atomic: atomicFromUsd(tiers.professional.price),
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

/**
 * Every amount this service will accept, for the on-chain payment scan.
 * Derived from the shelf rather than listed beside it: an amount the paywall
 * charges but the scan does not know is revenue that silently disappears
 * from the published figures.
 */
export const knownAmounts = (config) => paidRoutes(config).map((r) => r.atomic);

/**
 * The reverse of the tag: which route a settled transfer paid for.
 *
 * Returns null for an amount this service never charged, and for the base
 * amount below `TAGGED_FROM_BLOCK` — see the note there. A caller reports
 * null as unattributed; it must not fall back to a default route, which
 * would turn "we cannot know" into a figure that looks measured.
 */
export function routeResolver(config, { taggedFromBlock = TAGGED_FROM_BLOCK } = {}) {
  const routes = paidRoutes(config);
  const byAmount = new Map(routes.map((r) => [r.atomic, r.path]));
  const base = String(
    BigInt(config.priceAtomic ?? String(Math.round(parseFloat(String(config.priceUsdc)) * 1e6)))
  );
  return (amount, block) => {
    const path = byAmount.get(String(amount));
    if (!path) return null;
    if (String(amount) === base && Number(block) < taggedFromBlock) return null;
    return path;
  };
}
