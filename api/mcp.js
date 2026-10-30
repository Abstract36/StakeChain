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
import { buildExecution } from "./execute.js";

function buildServer() {
  const server = new McpServer({ name: "stakechain", version: "0.1.1" });

  server.tool(
    "list_base_yields",
    "Survey staking and lending opportunities on Base: APY, TVL, project and asset for each. " +
      "\n\nUse this for breadth — browsing the market, answering 'what is available', or " +
      "filtering a wide set. It covers pools this server cannot deposit into as well as ones " +
      "it can.\n\nUse something else when: you want one asset's single best option " +
      "(`best_yield`); you intend to deposit and need a contract address " +
      "(`list_lending_vaults`); you are judging one market rather than comparing many " +
      "(`market_profile`).\n\nRanks by TVL unless sortByApy is set. Four-digit emission farms " +
      "are filtered out by default. Returns market data, not a recommendation; any row's `pool` " +
      "id can be passed to `yield_history`.",
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
    "The single highest-APY pool on Base for one asset, with junk-farm filters applied " +
      "(minimum TVL, APY ceiling, no impermanent-loss exposure).\n\nUse this for a direct " +
      "'where is the best rate for X' question when one answer is wanted rather than a " +
      "list.\n\nUse something else when: you want to compare several options " +
      "(`list_base_yields`); you intend to deposit (`list_lending_vaults` returns the " +
      "address).\n\nImportant: it ranks by rate alone. A high answer here is a starting point, " +
      "not a verdict — follow it with `market_profile` for the curator's cut and whether the " +
      "money can be withdrawn, and `yield_history` for whether the rate has held.",
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
    "The Base lending shelf an agent can act on: Morpho ERC-4626 vaults, Aave V3 reserves, " +
      "Moonwell markets and this project's own staking pools, each with the contract address " +
      "to deposit into (`depositTo`), the asset's address and decimals, and a `risk` block " +
      "(fee, age, concentration, utilisation, incentive share).\n\nUse this whenever a " +
      "deposit might follow, or when you need a market id to pass to `market_profile` or " +
      "`yield_history`.\n\nUse `list_base_yields` instead when surveying the wider market, " +
      "including pools that cannot be deposited into here.\n\nRates for Aave and Moonwell are " +
      "read from their own contracts, so markets missing from aggregator snapshots appear here.",
    {},
    async () => {
      const vaults = await fetchBaseVaults();
      return { content: [{ type: "text", text: JSON.stringify({ count: vaults.length, vaults }, null, 2) }] };
    }
  );

  server.tool(
    "market_profile",
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
    "Daily APY and TVL history for one market, with min, median, max and volatility over the " +
      "window.\n\nUse this for one question only: has this rate held, or did it appear " +
      "yesterday? Call it before acting on any unusually high rate.\n\nUse something else " +
      "when: you want the other risk factors — fee, size, utilisation, concentration — which " +
      "are in `market_profile`; you are still choosing a market (`list_base_yields` or " +
      "`best_yield`).\n\nPrerequisite: a market id from one of the list tools. Check " +
      "`observations` before concluding anything — a market added recently has few snapshots, " +
      "and a short series is not evidence of stability.",
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

  server.tool(
    "build_deposit",
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
    {
      pool: z.string().describe("Market id from list_lending_vaults, e.g. 'sparkusdc', 'aave-usdc', 'mUSDC'"),
      amount: z.string().describe("Whole asset units, e.g. '25.5' — or 'all' to exit a position completely"),
      from: z.string().describe("The address that will sign and hold the position"),
      action: z.enum(["deposit", "withdraw"]).optional().describe("Defaults to deposit"),
    },
    async ({ pool, amount, from, action }) => {
      const built = await buildExecution({ pool, amount, from, action: action || "deposit" });
      return { content: [{ type: "text", text: JSON.stringify(built, null, 2) }] };
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
