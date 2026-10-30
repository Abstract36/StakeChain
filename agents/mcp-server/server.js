#!/usr/bin/env node
// StakeChain MCP server — lets any MCP-capable AI agent (Claude Code,
// Claude Desktop, custom Agent SDK apps) query Base staking yields as tools.
//
// Agents are first-class consumers of the product: free while the experiment
// bootstraps, then per-request USDC payments on Base via x402 (the API side
// answers 402 with payment requirements; the agent pays and retries).
//
// Usage (Claude Code):
//   claude mcp add stakechain -- node agents/mcp-server/server.js
// Env: STAKECHAIN_API (default http://localhost:4000)

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

const server = new McpServer({ name: "stakechain", version: "0.3.0" });

server.tool(
  "list_base_yields",
  "List current staking/lending yield opportunities on Base (APY, TVL, project). Optional filters.",
  {
    asset: z.string().optional().describe("Filter by asset symbol, e.g. ETH, USDC"),
    stable: z.boolean().optional().describe("Only stablecoin pools"),
    minTvl: z.number().optional().describe("Minimum TVL in USD"),
    sortByApy: z.boolean().optional().describe("Sort by APY descending"),
  },
  async ({ asset, stable, minTvl, sortByApy }) => {
    const q = new URLSearchParams();
    if (asset) q.set("asset", asset);
    if (stable) q.set("stable", "true");
    if (minTvl) q.set("minTvl", String(minTvl));
    if (sortByApy) q.set("sort", "apy");
    const data = await getJson(`/v1/yields?${q}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "best_yield",
  "Get the single highest-APY pool on Base for a given asset symbol.",
  { asset: z.string().describe("Asset symbol, e.g. ETH, USDC, cbBTC") },
  async ({ asset }) => {
    const data = await getJson(`/v1/best?asset=${encodeURIComponent(asset)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "list_lending_vaults",
  "List curated lending markets on Base — Morpho ERC-4626 vaults and Aave V3 reserves: " +
    "address, asset, APY, TVL. Rates for Aave are read from the Pool contract, not from " +
    "a third-party snapshot.",
  {},
  async () => {
    const data = await getJson("/vaults");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "yield_history",
  "Rate history for one market: daily APY/TVL plus min, median, max and volatility. " +
    "Answers whether today's APY is typical for this market or a spike — a current rate " +
    "on its own cannot tell you that.",
  {
    pool: z
      .string()
      .describe("Market id: a pool id from list_base_yields, or vault:<address> from list_lending_vaults"),
    days: z.number().optional().describe("Look-back window in days, default 30"),
  },
  async ({ pool, days }) => {
    const data = await getJson(
      `/history?pool=${encodeURIComponent(pool)}&days=${Math.min(days || 30, 365)}`
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "market_profile",
  "What to weigh besides the rate: size, how long the market has run, rate stability, " +
    "how much of the APY is lending interest rather than incentives that can stop, the " +
    "curator's cut, and how concentrated the deposits are. Returns every input alongside " +
    "the score and the weights used, so the number can be recomputed rather than trusted.",
  {
    pool: z
      .string()
      .describe("Vault symbol, address, or protocol-asset (e.g. sparkusdc, aave-usdc)"),
  },
  async ({ pool }) => {
    const data = await getJson(`/profile?pool=${encodeURIComponent(pool)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
