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

const server = new McpServer({ name: "stakechain", version: "0.1.0" });

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

const transport = new StdioServerTransport();
await server.connect(transport);
