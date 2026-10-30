#!/usr/bin/env node
// StakeChain MCP server — Base staking and lending yields as tools for any
// MCP-capable agent (Claude Code, Claude Desktop, Agent SDK apps).
//
// Two things shape the tool definitions here. Rates for Aave and Moonwell
// are read from those protocols' own contracts rather than a third-party
// snapshot, because snapshots have gaps that matter: DefiLlama has no
// Moonwell USDC market at all and reports Aave's Base USDC reserve at
// ~$400k against ~$175M on-chain. And every market carries the address to
// deposit into, so an agent can act on an answer rather than only compare.
//
// Usage (Claude Code):
//   claude mcp add stakechain -- npx -y stakechain-mcp
// Env: STAKECHAIN_API (default https://stakechain-api.vercel.app)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = process.env.STAKECHAIN_API || "https://stakechain-api.vercel.app";

async function getJson(path) {
  // operator's own agents bypass the paywall with the internal key
  const headers = process.env.STAKECHAIN_INTERNAL_KEY
    ? { "X-INTERNAL-KEY": process.env.STAKECHAIN_INTERNAL_KEY }
    : {};
  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 402) {
    const req = await res.json();
    return {
      paymentRequired: true,
      hint: "Pay per x402 spec (USDC on Base) and retry with X-PAYMENT header.",
      requirements: req,
    };
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const text = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

// Every tool here reads: nothing signs a transaction or moves funds, and
// all of them hit a live external API whose answers change by the minute.
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

const server = new McpServer({ name: "stakechain", version: "0.4.0" });

server.registerTool(
  "list_base_yields",
  {
    title: "List Base yield opportunities",
    description:
      "Survey staking and lending opportunities on Base: APY, TVL, project and asset for each. " +
      "Use this to see the landscape or to answer 'what is available', and use `best_yield` " +
      "instead when one asset's single best option is wanted. Results already exclude obvious " +
      "traps (minimum TVL, APY ceiling). Returns market data, not a recommendation; the `pool` " +
      "id of any row can be passed to `yield_history`.",
    inputSchema: {
      asset: z.string().optional().describe("Filter by asset symbol, e.g. 'USDC', 'ETH', 'cbBTC'"),
      stable: z.boolean().optional().describe("True returns stablecoin pools only"),
      minTvl: z
        .number()
        .optional()
        .describe("Minimum total deposits in USD, e.g. 10000000 for $10M"),
      sortByApy: z
        .boolean()
        .optional()
        .describe("True sorts by APY descending; default order is by TVL, largest first"),
    },
    annotations: READ_ONLY,
  },
  async ({ asset, stable, minTvl, sortByApy }) => {
    const q = new URLSearchParams({ limit: "100" });
    if (asset) q.set("asset", asset);
    if (stable) q.set("stable", "true");
    if (minTvl) q.set("minTvl", String(minTvl));
    if (sortByApy) q.set("sort", "apy");
    // free tier: the shelf narrowed to the top 100, filters and all
    return text(await getJson(`/yields?${q}`));
  }
);

server.registerTool(
  "best_yield",
  {
    title: "Best rate for one asset",
    description:
      "The single highest-APY pool on Base for one asset, with junk-farm filters applied " +
      "(minimum TVL, APY ceiling, no impermanent-loss exposure by default). Use it for a " +
      "direct 'where is the best rate for X' question. It ranks by rate alone, so before " +
      "committing capital check `market_profile` for what the curator charges and " +
      "`yield_history` for whether the rate has held.",
    inputSchema: {
      asset: z.string().describe("Asset symbol, e.g. 'USDC', 'ETH', 'cbBTC'"),
    },
    annotations: READ_ONLY,
  },
  async ({ asset }) => {
    // the free list, filtered the way best_yield would: no impermanent-loss
    // exposure, meaningful size, no emission spikes
    const q = new URLSearchParams({
      asset,
      sort: "apy",
      noIl: "true",
      minTvl: "1000000",
      limit: "1",
    });
    const data = await getJson(`/yields?${q}`);
    const best = data.pools?.[0];
    return text(
      best
        ? { asset: asset.toUpperCase(), best, consideredPools: data.total }
        : { asset: asset.toUpperCase(), error: "no pool clears the filters for this asset" }
    );
  }
);

server.registerTool(
  "list_lending_vaults",
  {
    title: "Deposit-ready lending markets",
    description:
      "The Base lending shelf an agent can actually act on: Morpho ERC-4626 vaults, Aave V3 " +
      "reserves and Moonwell markets, each with the contract address to deposit into " +
      "(`depositTo`) and the asset's address and decimals. Morpho entries also carry a `risk` " +
      "block: curator fee, vault age, allocation concentration, and how much of the APY comes " +
      "from incentives rather than borrower interest. Aave and Moonwell rates are read from " +
      "their own contracts, so markets missing from aggregator snapshots appear here.",
    inputSchema: {},
    annotations: READ_ONLY,
  },
  async () => text(await getJson("/vaults"))
);

server.registerTool(
  "yield_history",
  {
    title: "Has this rate held?",
    description:
      "Daily APY and TVL history for one market, with min, median, max and volatility over the " +
      "window. Answers the question a live rate cannot: whether today's APY is typical for this " +
      "market or a spike that appeared yesterday. Call it before acting on any unusually high " +
      "rate. `observations` says how many daily snapshots exist — a market added recently will " +
      "have few, and a short series should not be read as stability.",
    inputSchema: {
      pool: z
        .string()
        .describe(
          "Market id: the `pool` field from list_base_yields, or 'vault:<address>' using an " +
            "address from list_lending_vaults, e.g. 'vault:0x7bfa7c4f149e7415b73bdedfe609237e29cbf34a'"
        ),
      days: z.number().optional().describe("Look-back window in days, 1-365, default 30"),
    },
    annotations: { ...READ_ONLY, idempotentHint: true },
  },
  async ({ pool, days }) =>
    text(
      await getJson(
        `/history?pool=${encodeURIComponent(pool)}&days=${Math.min(days || 30, 365)}`
      )
    )
);

server.registerTool(
  "market_profile",
  {
    title: "What to weigh besides the rate",
    description:
      "Risk profile for one Morpho vault or Aave reserve, for use before committing capital. " +
      "Returns `score` (0-100) and `band` ('solid', 'fair', 'thin' or 'fragile'), plus a " +
      "`signals` object holding the six inputs behind it: size (TVL), track_record (days " +
      "running), stability (APY volatility from daily snapshots), yield_quality (share of the " +
      "APY that is borrower interest rather than incentives that can stop), cost (the curator's " +
      "percentage cut) and diversification (share sitting in the largest position). Each signal " +
      "carries its raw value and its sub-score, and `method.weights` gives the weighting, so " +
      "the score can be recomputed. A signal lacking data reports score null and is excluded " +
      "from the weighting rather than guessed at. Pair with `yield_history` for an unusually " +
      "high rate. Describes what has happened, not what will.",
    inputSchema: {
      pool: z
        .string()
        .describe(
          "Vault symbol, vault address, or protocol-asset — e.g. 'sparkusdc', 'aave-usdc', " +
            "'0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A'"
        ),
    },
    annotations: READ_ONLY,
  },
  async ({ pool }) => text(await getJson(`/profile?pool=${encodeURIComponent(pool)}`))
);

const transport = new StdioServerTransport();
await server.connect(transport);
