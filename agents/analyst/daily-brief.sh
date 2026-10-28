#!/bin/bash
# Resident analyst: writes a daily Base-yields brief using Claude headless
# with the StakeChain MCP server. Costs cents per run.
#
# Schedule ideas:
#   cron:   0 9 * * *  /path/to/agents/analyst/daily-brief.sh
#   Claude: /schedule "run agents/analyst/daily-brief.sh every weekday at 9:00"
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$DIR/briefs"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$(date +%F).md"

# claude from PATH when installed, otherwise via npx
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || echo "npx -y @anthropic-ai/claude-code")}"

$CLAUDE_BIN -p "You are StakeChain's resident yield analyst.
Using the stakechain MCP tools:
1) list_base_yields with minTvl 10000000 sorted by APY;
2) best_yield for USDC and for ETH.
Write a crisp daily brief in English to the file $OUT (overwrite):
date, top-5 opportunities table (protocol, asset, APY, TVL), best
stable/ETH picks, and one 'what changed' note if anything looks unusual.
Market data only, no financial advice wording." \
  --allowedTools "Write,mcp__stakechain__list_base_yields,mcp__stakechain__best_yield" \
  --mcp-config "{\"mcpServers\":{\"stakechain\":{\"command\":\"node\",\"args\":[\"$DIR/../mcp-server/server.js\"]}}}" \
  >/dev/null

echo "brief written: $OUT"
