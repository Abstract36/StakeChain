# stakechain-mcp

Live staking and lending yields on **Base** as MCP tools for AI agents, by
[StakeChain Labs](https://github.com/Abstract36/StakeChain).

## Tools

- `list_base_yields` — current opportunities (APY, TVL, project) with
  filters: asset, stablecoin-only, min TVL, sort by APY
- `best_yield` — highest-APY pool for an asset (single-sided by default,
  junk-farm filters built in)

## Use

```bash
# Claude Code
claude mcp add stakechain -- npx -y stakechain-mcp
```

```json
// Claude Desktop (claude_desktop_config.json)
{
  "mcpServers": {
    "stakechain": { "command": "npx", "args": ["-y", "stakechain-mcp"] }
  }
}
```

Env: `STAKECHAIN_API` — API base URL (default
`https://stakechain-api.vercel.app`).

## Payments (x402)

The paid API tier speaks the [x402 protocol](https://x402.org): HTTP 402 →
pay USDC on Base → retry with `X-PAYMENT`. Free while the experiment
bootstraps. Data source: DefiLlama + Morpho. Market data, not financial
advice.
