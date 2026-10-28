# AI agents inside StakeChain

StakeChain treats AI agents as first-class users, not an afterthought. The
product has two machine-facing surfaces:

## 1. MCP server (`mcp-server/`)

Exposes the yields aggregator as tools any MCP-capable agent can call
(Claude Code, Claude Desktop, Agent SDK apps):

- `list_base_yields` — current staking/lending opportunities on Base with filters
- `best_yield` — highest-APY pool for an asset

Setup:

```bash
# published on npm — no clone needed, e.g. Claude Code:
claude mcp add stakechain -- npx -y stakechain-mcp
# or from a checkout:
cd agents/mcp-server && npm install
claude mcp add stakechain -- node /path/to/agents/mcp-server/server.js
```

## 2. x402 machine payments (monetization)

The `/v1/*` API endpoints speak the [x402 protocol](https://x402.org):
a request without payment gets HTTP `402` + payment requirements (USDC on
Base, pay-to = admin wallet). The agent pays on-chain and retries with the
`X-PAYMENT` header. No accounts, no API keys, no invoices — the entire
billing loop is automated on the blockchain.

While the experiment bootstraps, `X402_ENFORCE=false` keeps everything free
so agents can integrate early.

## Example: autonomous yield-watch agent (Claude Agent SDK)

```js
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "Check the best USDC yield on Base via stakechain tools. " +
          "If the top APY changed by >0.5% since the last run, write a short alert to alerts.md.",
  options: {
    mcpServers: {
      stakechain: { command: "node", args: ["agents/mcp-server/server.js"] },
    },
  },
})) {
  if (msg.type === "result") console.log(msg.result);
}
```

Run it on a schedule (cron / Claude Code `/schedule`) and the product has a
resident analyst that costs cents per day.
