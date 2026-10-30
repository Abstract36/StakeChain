// Hosted MCP endpoint (Streamable HTTP, stateless) — the same tools the
// stdio package offers, served at POST /mcp for registries and remote
// clients. This lane is free: it is distribution; high-volume integrators
// use the x402-paid REST endpoints.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { fetchBaseYields, fetchBaseVaults } from "./data.js";
import { applyQuery, pickBest } from "./filters.js";
import { marketHistory } from "./history.js";
import { marketProfile } from "./profile.js";

function buildServer() {
  const server = new McpServer({ name: "stakechain", version: "0.1.1" });

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
      const pools = applyQuery(await fetchBaseYields(), {
        asset,
        stable,
        minTvl,
        sort: sortByApy ? "apy" : undefined,
      });
      return { content: [{ type: "text", text: JSON.stringify({ count: pools.length, pools }, null, 2) }] };
    }
  );

  server.tool(
    "best_yield",
    "Get the single highest-APY pool on Base for a given asset symbol (junk-farm filters built in).",
    { asset: z.string().describe("Asset symbol, e.g. ETH, USDC, cbBTC") },
    async ({ asset }) => {
      const best = pickBest(await fetchBaseYields(), { asset });
      return {
        content: [
          { type: "text", text: JSON.stringify(best ? { asset, best } : { asset, error: "no qualifying pool" }, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "list_lending_vaults",
    "List curated lending markets on Base — Morpho ERC-4626 vaults and Aave V3 reserves: address, asset, APY, TVL.",
    {},
    async () => {
      const vaults = await fetchBaseVaults();
      return { content: [{ type: "text", text: JSON.stringify({ count: vaults.length, vaults }, null, 2) }] };
    }
  );

  server.tool(
    "market_profile",
    "What to weigh besides the rate: size, how long the market has run, rate " +
      "stability, how much of the APY is lending interest rather than incentives " +
      "that can stop, the curator's cut, and how concentrated the deposits are. " +
      "Returns every input alongside a score and the weights used, so the number " +
      "can be recomputed rather than taken on faith.",
    {
      pool: z
        .string()
        .describe("Vault symbol, address, or protocol-asset (e.g. sparkusdc, aave-usdc)"),
    },
    async ({ pool }) => {
      const profile = await marketProfile(pool);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(profile || { pool, error: "market not found" }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "yield_history",
    "Rate history for one market: daily APY/TVL plus min, median, max and volatility. " +
      "Answers whether today's APY is typical for this market or a spike — a current " +
      "rate on its own cannot tell you that.",
    {
      pool: z
        .string()
        .describe("Market id: a pool id from list_base_yields, or vault:<address> from list_lending_vaults"),
      days: z.number().optional().describe("Look-back window in days, default 30"),
    },
    async ({ pool, days }) => {
      const history = await marketHistory(pool, Math.min(days || 30, 365));
      return { content: [{ type: "text", text: JSON.stringify(history, null, 2) }] };
    }
  );

  return server;
}

export async function handleMcp(req, res) {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: each POST is independent
    enableJsonResponse: true,
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
