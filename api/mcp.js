// Hosted MCP endpoint (Streamable HTTP, stateless) — the same tools the
// stdio package offers, served at POST /mcp for registries and remote
// clients. This lane is free: it is distribution; high-volume integrators
// use the x402-paid REST endpoints.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { fetchBaseYields, fetchBaseVaults } from "./data.js";
import { applyQuery, pickBest } from "./filters.js";

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
    "List curated ERC-4626 lending vaults on Base (Morpho): address, asset, APY, TVL.",
    {},
    async () => {
      const vaults = await fetchBaseVaults();
      return { content: [{ type: "text", text: JSON.stringify({ count: vaults.length, vaults }, null, 2) }] };
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
