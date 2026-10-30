#!/usr/bin/env bash
# Opens the Tier 1 outreach issues from docs/OUTREACH.md.
#
#   bash docs/scripts/open-outreach-issues.sh            # all five
#   bash docs/scripts/open-outreach-issues.sh barker     # just one
#
# Needs an authenticated `gh`. Issues are posted under your account and
# read by real people, so the script prints each one and pauses for a
# keypress before sending it. Skips a repo where you already have an open
# issue, so re-running is safe.
set -uo pipefail

post() { # repo, title, body(stdin)
  local repo="$1" title="$2" body
  body="$(cat)"

  if gh issue list --repo "$repo" --author "@me" --state open --json number \
       --jq 'length' 2>/dev/null | grep -qv '^0$'; then
    echo "-- $repo: you already have an open issue there, skipping"
    return
  fi

  echo
  echo "================ $repo"
  echo "TITLE: $title"
  echo "---"
  echo "$body"
  echo "---"
  read -r -p "Send this issue? [y/N] " ok </dev/tty
  [[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "-- skipped"; return; }

  gh issue create --repo "$repo" --title "$title" --body "$body"
}

ONLY="${1:-all}"
want() { [[ "$ONLY" == "all" || "$ONLY" == "$1" ]]; }

# ---------------------------------------------------------------- barker
want barker && post barkermoney/barker-mcp \
  "Free rate-history data for the yield advisor (daily APY/TVL series with volatility)" <<'EOF'
Hi — Barker and StakeChain are working on adjacent halves of the same problem, so this is an offer rather than a pitch.

I run an open-source Base yields API that recently started keeping a **daily APY/TVL series per market**:

```
GET https://stakechain-api.vercel.app/history?pool=vault:0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A&days=30
```

It returns the raw series plus min, median, max and volatility. It exists because an advisor cannot responsibly rank an 18% vault against an 8% one from spot rates alone — one Morpho vault slid 23.9% → 17.6% inside a day while I was testing, and a series like that cannot be reconstructed after the fact.

Free and keyless. `npx -y stakechain-mcp` exposes it as the `yield_history` tool, or hit REST directly. There is also `market_profile`, which returns the things that change what a rate is worth — curator fee, vault age, allocation concentration, and how much of the APY is lending interest rather than incentives — with the weights printed alongside, so a score can be recomputed rather than trusted.

One finding you may be able to use regardless: **DefiLlama reports Aave's Base USDC reserve — roughly $172M supplied at ~9.4% — with zero TVL**, so the best stablecoin rate on the chain is missing from anything that trusts their snapshot. We read the Pool contract and the Aave oracle instead.

If the advisor would want fields we don't expose yet (drawdown, days above a threshold, per-curator aggregation), say which and I'll add them — the collection is young enough to shape around real use.

MIT, no token pitch attached: https://github.com/Abstract36/StakeChain
EOF

# ----------------------------------------------------------------- gblin
want gblin && post gblinproject/GBLIN-MCP \
  "Base lending shelf + rate stability data for the idle-USDC treasury index" <<'EOF'
Your treasury index has to answer "where does idle USDC go this week" — that's the question this API feeds, and it's free and keyless.

- `list_lending_vaults` — the Base lending shelf in one call: Morpho ERC-4626 vaults and Aave V3 reserves with APY, TVL, curator fee and vault age.
- `yield_history` — daily APY/TVL per market with volatility, so a rate can be checked for stability *before* allocation rather than explained after it.
- `market_profile` — size, track record, fee, allocation concentration and how much of the APY is lending interest rather than incentives that can stop.

`npx -y stakechain-mcp`, or REST at https://stakechain-api.vercel.app.

Worth knowing either way: Aave rates and sizes here come from the Pool contract and the Aave oracle, not a third-party snapshot. DefiLlama currently reports the Base USDC reserve — ~$172M supplied at ~9.4% — with zero TVL, so it's invisible in anything that trusts them.

If the output shape is awkward for your JIT-swap flow, tell me what you'd rather have.

MIT: https://github.com/Abstract36/StakeChain
EOF

# --------------------------------------------------------------- catalog
want catalog && post withgrokbot/verified-catalog \
  "Service for the catalog: StakeChain Base yields (x402, USDC on Base)" <<'EOF'
Submitting an endpoint, with everything a factual check needs:

- **Endpoint:** `https://stakechain-api.vercel.app/v1/yields` — answers 402 with real requirements, settles through the Coinbase facilitator
- **Price:** $0.001 per call. Subscriptions at `/v1/subscribe/developer` and `/v1/subscribe/professional` ($19 / $99 per 30 days, paid the same way, returns a signed key)
- **Free tier, no key:** `/yields`, `/vaults`, `/history`, `/profile`, and MCP over `POST /mcp`
- **Verification:** `/stats` reports payments, unique payers and revenue computed from on-chain USDC transfers, with a BaseScan link. Our own agent's calls are labelled `internal_payments` — at the time of writing *every* payment is internal and the figure says so, which is rather the point of publishing it.
- **Source:** https://github.com/Abstract36/StakeChain (MIT)

Tell me what else a check wants exposed and I'll add it.
EOF

# --------------------------------------------------------------- payfetch
want payfetch && post forum-labs/payfetch \
  "A live x402 seller to test spend caps against" <<'EOF'
If you want a real seller for integration tests rather than a mock:

```
https://stakechain-api.vercel.app/v1/yields
```

Answers 402 with genuine requirements and settles through the Coinbase facilitator. $0.001 a call, so a full test run costs cents.

What makes it useful as a fixture: every settled payment shows up at `/stats`, computed from chain data with a BaseScan link — so a test can assert end to end that a payment actually landed, rather than trusting a 200. There's also a $19/30d subscription route if you want to exercise a larger-amount path and a non-trivial approval prompt.

Use it freely, no coordination needed. If a response shape makes your client's life hard, that's a bug on my side and I'd like to hear about it.

https://github.com/Abstract36/StakeChain
EOF

# ----------------------------------------------------------------- a2a
want a2a && post sukrutkrdg/x402-bazaar-mcp \
  "Two-way trade: we'd pay per call for token-safety checks" <<'EOF'
Our API already buys from other x402 sellers and resells the result (`api/a2a.js` — registry in env, we pay upstream on-chain and pass the settlement through), so this is a trade rather than a favour.

When an agent asks us about a token we don't cover, we'd route the call to your safety checks and pay per request. In the other direction: if your users ask whether a Base yield is real or a spike, `yield_history` answers it — daily APY/TVL series with volatility, free and keyless, `npx -y stakechain-mcp`.

Want to try one call each way? Happy to register your endpoint on our side first and show you the settlement tx.

https://github.com/Abstract36/StakeChain
EOF

echo
echo "done — record replies in docs/OUTREACH.md's tracking table"
