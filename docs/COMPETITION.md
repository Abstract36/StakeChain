# Who else serves yield data to agents

Checked 2026-10-30 by calling their MCP endpoints, not by reading their
marketing. Re-check before leaning on any of it.

## The field is not empty

| Server | Tools | What it is |
|---|---|---|
| `bitcompare` | 21 | Broad crypto data: rates across CeFi and DeFi providers, coins, prices, stablecoin indices, fear & greed. Has `get_rate_history` (30d per-tick) and `get_rate_changes` (a provenance log of every material move). Substantial. |
| `yieldprobe` | 5 | Closest positioning to ours: top yields, APY movers, peg monitor, token honeypot check. $0.02 a call — 20× our price. |
| Clicks Protocol | 4 | Base DeFi yield, read-only. Maintenance graded D. |
| `usenami-mcp` | 6 | Funding rates and RWA spreads. Maintenance F, last touched May. |
| Wicked API | — | Broad crypto/stocks/prediction markets. Maintenance F. |
| `baseusdcearn` | — | Listed, but the endpoint serves a hosting placeholder. Dead. |

**Correction to an earlier assumption:** rate history is *not* unique to
us. bitcompare's is deeper, and yieldprobe reports 30-day mean and
volatility. Selling "we keep history" as the differentiator would lose.

Note also how many are graded D or F on maintenance. The bar for simply
staying alive is lower than the bar for being first.

## What is actually ours

### 1. Data an agent can act on

yieldprobe's own tool description says it returns candidates "**not a
safety verdict or executable deposit quote**". bitcompare is a data API.
Neither returns the contract to deposit into.

Our `list_lending_vaults` returns `depositTo` per market and the dashboard
branches across three protocol interfaces (ERC-4626 `deposit`, Aave
`Pool.supply`, Compound-style `mint`). An agent can go from question to
transaction without leaving the answer.

### 2. Read from the protocols, not from an aggregator

yieldprobe's description names its source: **DefiLlama data**. That source
has measurable gaps on Base, verified 2026-10-30:

| Market | DefiLlama | Read on-chain |
|---|---|---|
| Moonwell USDC | **absent entirely** (14 Moonwell Base rows, none USDC) | $7.5M at 16.21% |
| Aave V3 USDC | $413k | **$175M** at 8.46% |

The Aave figure is off by roughly 400×, so any "minimum TVL $10M" filter
drops it. Between them these are the two best USDC rates on Base, and a
service built on that snapshot cannot see either.

This is checkable in one call against each protocol — which is the only
reason it is worth claiming.

### 3. Risk decomposed at the vault level

Curator fee, allocation concentration, vault age, and how much of the APY
is lending interest rather than incentives — each shown with its value and
a published weighting. yieldprobe's `token_security_check` is honeypot and
owner-powers analysis on a *token*; bitcompare scores stablecoin peg
stability. Neither asks what the curator keeps.

## How to position against this

Lead with **"tells an agent where to put the money, and what the curator
takes, read from the protocols rather than an aggregator"**.

Do not lead with rate history — it is table stakes here, not an edge.

Do not race on tool count. 21 broad tools versus 5 deep ones on Base is
not a contest worth entering; narrow and executable is the defensible
position.
