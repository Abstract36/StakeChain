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

const server = new McpServer({ name: "stakechain", version: "0.6.0" });

server.registerTool(
  "list_base_yields",
  {
    title: "List Base yield opportunities",
    description:
      "Survey staking and lending opportunities on Base: APY, TVL, project and asset for each. " +
      "\n\nUse this for breadth — browsing the market, answering 'what is available', or " +
      "filtering a wide set. It covers pools this server cannot deposit into as well as ones " +
      "it can.\n\nUse something else when: you want one asset's single best option " +
      "(`best_yield`); you intend to deposit and need a contract address " +
      "(`list_lending_vaults`); you are judging one market rather than comparing many " +
      "(`market_profile`).\n\nRanks by TVL unless sortByApy is set. Four-digit emission farms " +
      "are filtered out by default. Returns market data, not a recommendation; any row's `pool` " +
      "id can be passed to `yield_history`.",
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
      "(minimum TVL, APY ceiling, no impermanent-loss exposure).\n\nUse this for a direct " +
      "'where is the best rate for X' question when one answer is wanted rather than a " +
      "list.\n\nUse something else when: you want to compare several options " +
      "(`list_base_yields`); you intend to deposit (`list_lending_vaults` returns the " +
      "address).\n\nImportant: it ranks by rate alone. A high answer here is a starting point, " +
      "not a verdict — follow it with `market_profile` for the curator's cut and whether the " +
      "money can be withdrawn, and `yield_history` for whether the rate has held.",
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
      "The Base lending shelf an agent can act on: Morpho ERC-4626 vaults, Aave V3 reserves, " +
      "Moonwell markets and this project's own staking pools, each with the contract address " +
      "to deposit into (`depositTo`), the asset's address and decimals, and a `risk` block " +
      "(fee, age, concentration, utilisation, incentive share).\n\nUse this whenever a " +
      "deposit might follow, or when you need a market id to pass to `market_profile` or " +
      "`yield_history`.\n\nUse `list_base_yields` instead when surveying the wider market, " +
      "including pools that cannot be deposited into here.\n\nRates for Aave and Moonwell are " +
      "read from their own contracts, so markets missing from aggregator snapshots appear here.",
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
      "window.\n\nUse this for one question only: has this rate held, or did it appear " +
      "yesterday? Call it before acting on any unusually high rate.\n\nUse something else " +
      "when: you want the other risk factors — fee, size, utilisation, concentration — which " +
      "are in `market_profile`; you are still choosing a market (`list_base_yields` or " +
      "`best_yield`).\n\nPrerequisite: a market id from one of the list tools. Check " +
      "`observations` before concluding anything — a market added recently has few snapshots, " +
      "and a short series is not evidence of stability.",
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
      "Risk profile for one market, for the moment before capital is committed.\n\nUse this " +
      "when a specific market has been chosen and the question is whether to go ahead. It is " +
      "the one tool that answers 'what else should I know besides the rate'.\n\nUse something " +
      "else when: you are still choosing between markets (`list_base_yields`, `best_yield`); " +
      "you only want to know whether the rate moved (`yield_history`); you need the deposit " +
      "address (`list_lending_vaults`).\n\nPrerequisite: the market must be on this " +
      "server's shelf — a vault, reserve or pool from `list_lending_vaults`. Arbitrary pool " +
      "ids from `list_base_yields` will not resolve.\n\n" +
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

server.registerTool(
  "build_deposit",
  {
    title: "Build the transactions",
    description:
      "Turns a chosen market into signed-ready calldata: an ordered list of transactions to " +
      "deposit into it or leave it, across Morpho vaults, Aave reserves, Moonwell markets and " +
      "this project's staking pools — three different protocol interfaces behind one call. The " +
      "approve step is included only when the current allowance does not already cover the " +
      "amount, read on-chain at request time.\n\nUse this once a market has been chosen and the " +
      "decision is made.\n\nUse something else when: still choosing (`list_lending_vaults`, " +
      "`best_yield`); weighing whether to go ahead (`market_profile`, `yield_history`).\n\n" +
      "Nothing is signed or sent — the caller holds the keys. Simulate before sending. " +
      "`amount: \"all\"` on a withdrawal exits by share rather than by figure, so interest " +
      "accruing between the call and the block is not left behind.",
    inputSchema: {
      pool: z.string().describe("Market id from list_lending_vaults, e.g. 'sparkusdc', 'aave-usdc', 'mUSDC'"),
      amount: z.string().describe("Whole asset units, e.g. '25.5' — or 'all' to exit a position completely"),
      from: z.string().describe("The address that will sign and hold the position"),
      action: z.enum(["deposit", "withdraw"]).optional().describe("Defaults to deposit"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  async ({ pool, amount, from, action }) => {
    const q = new URLSearchParams({ pool, amount, from, action: action || "deposit" });
    return text(await getJson(`/execute?${q}`));
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
