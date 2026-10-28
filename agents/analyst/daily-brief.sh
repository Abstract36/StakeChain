#!/bin/bash
# Resident analyst: writes a daily Base-yields brief using Claude headless
# with the StakeChain MCP server. Costs cents per run.
#
# Schedule ideas:
#   cron:   0 9 * * *  /path/to/agents/analyst/daily-brief.sh
#   Claude: /schedule "run agents/analyst/daily-brief.sh every weekday at 9:00"
set -euo pipefail

# cron ships a minimal PATH; make node (nvm) and user bins visible
for d in "$HOME"/.nvm/versions/node/*/bin; do PATH="$d:$PATH"; done
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

# paywall bypass for the operator's own agent (STAKECHAIN_INTERNAL_KEY)
[ -f "$HOME/.stakechain.env" ] && . "$HOME/.stakechain.env"

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

# public journal: commit the brief to the repo (push best-effort — cron may
# have no ssh agent; failures only log)
REPO="$DIR/../.."
if git -C "$REPO" add "$OUT" && ! git -C "$REPO" diff --cached --quiet; then
  git -C "$REPO" commit -q -m "analyst: daily brief $(date +%F)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  git -C "$REPO" push -q origin main || echo "push failed (no agent?) — commit kept locally"
fi
