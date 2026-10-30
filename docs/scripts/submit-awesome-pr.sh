#!/usr/bin/env bash
# Opens the StakeChain pull request against punkpeye/awesome-mcp-servers.
# Needs an authenticated `gh` (run `gh auth status` to check). Safe to
# re-run: it refuses rather than duplicating an entry or a branch.
#
#   bash docs/scripts/submit-awesome-pr.sh
set -euo pipefail

UPSTREAM="punkpeye/awesome-mcp-servers"
BRANCH="add-stakechain-mcp"
WORKDIR="$(mktemp -d)"

ENTRY='- [Abstract36/StakeChain](https://github.com/Abstract36/StakeChain/tree/main/agents/mcp-server) [![Abstract36/StakeChain MCP server](https://glama.ai/mcp/servers/Abstract36/StakeChain/badges/score.svg)](https://glama.ai/mcp/servers/Abstract36/StakeChain) 📇 ☁️ 🍎 🪟 🐧 - Base staking and lending yields for agents: Morpho vaults and Aave V3 reserves read from the Pool contract rather than a third-party snapshot, plus a daily APY/TVL history with volatility so a spike can be told from a stable rate. Free hosted tier; optional x402 pay-per-call in USDC on Base. `npx -y stakechain-mcp`'

echo "==> forking and cloning $UPSTREAM"
gh repo fork "$UPSTREAM" --clone --fork-name awesome-mcp-servers -- "$WORKDIR/awesome" >/dev/null
cd "$WORKDIR/awesome"
git checkout -b "$BRANCH"

echo "==> inserting the entry into Finance & Fintech"
ENTRY="$ENTRY" python3 - <<'PY'
import os, sys
anchor = '### 💰 <a name="finance--fintech"></a>Finance & Fintech\n'
entry = os.environ["ENTRY"] + "\n"
readme = open("README.md", encoding="utf-8").read()
if "Abstract36/StakeChain" in readme:
    sys.exit("already listed upstream — nothing to do")
if anchor not in readme:
    sys.exit("Finance & Fintech heading not found; the list's format changed")
open("README.md", "w", encoding="utf-8").write(readme.replace(anchor, anchor + entry, 1))
print("entry inserted")
PY

git add README.md
# The clone is a fresh temp dir, so it inherits nothing: give it an
# identity explicitly rather than relying on a global git config.
git config user.name "Abstract36"
git config user.email "denisssolonin798@gmail.com"
git commit -q -m "Add StakeChain Base yields MCP server"
git push -q -u origin "$BRANCH"

echo "==> opening the pull request"
gh pr create --repo "$UPSTREAM" \
  --title "Add StakeChain Base yields MCP server 🤖🤖🤖" \
  --body 'Adds **stakechain-mcp** to Finance & Fintech. Live Base staking and lending yields as MCP tools, published on npm (`npx -y stakechain-mcp`) and listed in the official MCP registry as `io.github.Abstract36/stakechain`.

Two things that set it apart from the other yield tools in this section:

- **Aave V3 rates and sizes are read from the Pool contract and the Aave oracle**, not from a third-party snapshot. DefiLlama currently reports the Base USDC reserve — roughly $172M supplied at ~9.4% — with zero TVL, so the best stablecoin rate on the chain is invisible in aggregators that trust it.
- **A daily APY/TVL history is committed to the public repo**, so the `yield_history` tool reports min, median, max and volatility rather than only a spot rate. A live APY cannot say whether a rate has held or appeared yesterday.

Free hosted tier, no API key or signup. Optional x402 pay-per-call in USDC on Base, settled through the Coinbase facilitator. MIT licensed, audit and supply breakdown in the repo: https://github.com/Abstract36/StakeChain

🤖 Generated with [Claude Code](https://claude.com/claude-code)'

echo "==> done; working copy left at $WORKDIR/awesome"
