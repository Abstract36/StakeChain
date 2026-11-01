// Documents an agent reads before it decides whether this service is worth
// a call: the x402 catalogue at /.well-known/x402, an OpenAPI description,
// and an llms.txt for crawlers and models that look for one.
//
// All three are generated from catalogue.js. Writing them by hand is how a
// discovery document comes to describe a service that no longer exists —
// an agent follows it, pays for a route that moved, and the failure looks
// like ours rather than the document's.
import { paidRoutes, freeRoutes } from "./catalogue.js";

const TITLE = "StakeChain Yields API";
const SUMMARY =
  "Base staking and lending yields for AI agents: rates, the contract address to " +
  "deposit into, and unsigned calldata to get there. Aave, Moonwell and this " +
  "project's own pools are read from the protocols' contracts rather than from an " +
  "aggregator snapshot, and every row says which.";

/** The x402 catalogue: what is payable here, on what rail, at what price. */
export function x402Document({ baseUrl, payTo, usdc, network, priceUsdc, priceAtomic, tiers }) {
  const paid = paidRoutes({ priceUsdc, priceAtomic, tiers });
  const entries = paid.map((r) => ({
    resource: {
      url: `${baseUrl}${r.path}`,
      description: r.description,
      mimeType: "application/json",
    },
    x402Version: 2,
    method: r.method,
    price: { mode: "fixed", currency: "USD", amount: String(r.price).replace(/^\$/, "") },
    network,
    asset: "USDC",
    tags: r.tags,
    accepts: [
      {
        scheme: "exact",
        network,
        amount: r.atomic,
        asset: usdc,
        payTo,
        extra: { name: "USD Coin", version: "2" },
      },
    ],
  }));

  return {
    version: 1,
    info: {
      title: TITLE,
      description: SUMMARY,
      homepage: "https://github.com/Abstract36/StakeChain",
      contact: { name: "StakeChain", url: "https://github.com/Abstract36/StakeChain/issues" },
      networks: [network],
    },
    resources: paid.map((r) => `${baseUrl}${r.path}`),
    entries,
    free: freeRoutes.map((r) => ({
      url: `${baseUrl}${r.path}`,
      method: r.method,
      description: r.description,
    })),
    instructions:
      "Paid routes settle in USDC on Base over x402 v2: an unpaid request answers 402 with " +
      "the challenge in the PAYMENT-REQUIRED header, and the payment goes back in " +
      "PAYMENT-SIGNATURE. Echo the declaration exactly as the 402 sent it — `resource` as " +
      "the object, not its url. Every data route is also available free and keyless without " +
      "the /v1 prefix; the paid tier is for volume and for agents that prefer paying to " +
      "holding a key. Payment figures for this service are public at /stats.",
  };
}

/** OpenAPI 3.1, free and paid shelves together. */
export function openApiDocument({ baseUrl, priceUsdc, priceAtomic, tiers }) {
  const paths = {};
  const op = (r, { paid } = {}) => ({
    summary: r.description,
    description: paid
      ? `Paid: ${r.price} per call in USDC on Base over x402, or an X-API-KEY from a subscription. An unpaid request answers 402 with the challenge.`
      : "Free and keyless.",
    parameters: Object.entries(r.query || r.discovery?.input || {}).map(([name, example]) => ({
      name, in: "query", required: false, example, schema: { type: "string" },
    })),
    responses: {
      200: {
        description: "ok",
        content: {
          "application/json": {
            ...(r.discovery?.output?.schema ? { schema: r.discovery.output.schema } : {}),
            ...(r.discovery?.output?.example ? { example: r.discovery.output.example } : {}),
          },
        },
      },
      ...(paid ? { 402: { description: "payment required; terms in the PAYMENT-REQUIRED header" } } : {}),
    },
  });

  for (const r of freeRoutes) {
    paths[r.path] = { ...(paths[r.path] || {}), [r.method.toLowerCase()]: op(r) };
  }
  for (const r of paidRoutes({ priceUsdc, priceAtomic, tiers })) {
    paths[r.path] = { ...(paths[r.path] || {}), [r.method.toLowerCase()]: op(r, { paid: true }) };
  }

  return {
    openapi: "3.1.0",
    info: { title: TITLE, version: "1.0.0", description: SUMMARY, license: { name: "MIT" } },
    servers: [{ url: baseUrl }],
    paths,
  };
}

/** llms.txt: the service in the form a model reads first. */
export function llmsTxt({ baseUrl, priceUsdc, priceAtomic, tiers }) {
  const line = (r) => `- [${r.method} ${r.path}](${baseUrl}${r.path}): ${r.description}`;
  const priced = (r) => `${line(r)} — **${r.price}** (${r.atomic} atomic USDC)`;
  return `# StakeChain

> ${SUMMARY}

Every number carries its origin. A row says \`source: "onchain"\` with the Base
\`block\` it was read at, \`"morpho-api"\` for Morpho's own GraphQL, or
\`"defillama"\` for a third-party snapshot. A response also names any upstream
it could not reach, because a protocol missing from the list is not a protocol
with nothing to offer: DefiLlama carries no Moonwell USDC market at all, so an
unreachable RPC removes the market rather than ageing it.

## Free and keyless

${freeRoutes.map(line).join("\n")}

## Paid (x402, USDC on Base)

${paidRoutes({ priceUsdc, priceAtomic, tiers }).map(priced).join("\n")}

The same data as the free shelf without the rate ceiling; an unpaid request
answers 402 with the terms in the PAYMENT-REQUIRED header. Catalogue:
[/.well-known/x402](${baseUrl}/.well-known/x402)

The per-call prices differ by a millionth of a dollar on purpose. USDC has six
decimals, so the amount that settles on Base can carry which route was bought
— and then \`/stats\` reports revenue per route from the chain itself, rather
than from a server log that this host keeps for one hour.

## For agents

- MCP over stdio: \`npx -y stakechain-mcp\`
- MCP over HTTP: \`POST ${baseUrl}/mcp\`
- Six tools: list yields, best rate for an asset, deposit-ready vaults, rate
  history, market profile, and build the deposit transactions.

## What this is not

Market data, not advice. The filters remove obvious traps — a minimum TVL, an
APY ceiling, no impermanent-loss exposure by default — and cannot make a market
safe. Rate history began on 2026-10-30, so series are short and a short series
is not evidence of stability. Payment and revenue figures for this service are
published at [${baseUrl}/stats](${baseUrl}/stats), including how much of the
traffic is our own.

## Source

- [Repository](https://github.com/Abstract36/StakeChain) (MIT)
- [API reference](https://github.com/Abstract36/StakeChain/blob/main/docs/API.md)
`;
}

export const robotsTxt = `# Agents and model crawlers are the intended audience here.
User-agent: *
Allow: /

# Named explicitly so that a crawler checking for itself finds a yes.
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /
`;
