# B2B outreach kit

Audience: builders who already ship x402 or MCP services. They understand
the protocol, so the pitch is one concrete thing we have that they don't —
not an introduction to agent payments.

**What we actually offer them**, in the order that lands:

1. **Rate history.** Daily APY/TVL snapshots per market, with volatility,
   served free at `/history` and as the `yield_history` tool. A live APY
   cannot say whether a rate held or appeared yesterday. Nobody else in the
   agent ecosystem has this series, and it cannot be backfilled.
2. **Data the aggregators get wrong.** DefiLlama reports Aave's Base USDC
   reserve (~$172M at ~9.4%) with zero TVL. We read the Pool and oracle
   directly. Good opener with anyone who consumes yield data.
3. **A working x402 seller** with public revenue at `/stats`, settled
   through the Coinbase facilitator — useful to anyone building the paying
   side who wants a live endpoint to test against.

**Rules.** No mass DMs; each message references what that project actually
does. Never pitch STACH the token — the data is the product, the token is
the experiment. Offer the free tier; the subscription comes up only if they
ask about volume.

---

## Tier 1 — they consume yield data (highest intent)

Found in the Finance & Fintech section of punkpeye/awesome-mcp-servers,
which carries ~60 x402 projects.

| Project | Why they care |
|---|---|
| `barkermoney/barker-mcp` | Stablecoin yield index with a yield advisor and risk scoring — our history series is the input their advisor is missing |
| `gblinproject/GBLIN-MCP` | Parks idle agent USDC on Base; needs to know which market and whether the rate is real |
| `Fabio662/yieldagentx402-sdks` | Policy-gated execution for agents — policies need rate stability, not a spot number |
| `agency.lona/trading` (MCP registry) | Strategy backtesting; historical yield series is a backtest input |
| `tunedforai/x402-mcp`, `namixai/funding-mcp` | Market-structure and funding data — adjacent series, natural cross-reference |

**Opener:**

> Saw <project> — <one specific true line about what it does>.
>
> I run a Base yields API that now keeps a daily APY/TVL series per market,
> free: `/history?pool=<id>&days=30` returns min / median / max and
> volatility. It exists because a live APY can't tell you whether a rate
> held or appeared yesterday — one vault I was testing slid 23.9% → 17.6%
> in a day.
>
> Two things you might use directly: the series as an input to <their
> feature>, and the fact that DefiLlama reports Aave's Base USDC reserve
> (~$172M at ~9.4%) with zero TVL — we read the Pool contract instead, so
> it shows up.
>
> Free tier, no key: `npx -y stakechain-mcp`. Repo:
> github.com/Abstract36/StakeChain — happy to add fields if something's
> missing for your case.

## Tier 2 — directories and reliability catalogs (list us)

| Target | Ask |
|---|---|
| `withgrokbot/verified-catalog` | Reliability lookup for x402 endpoints — ask to be indexed |
| `jblaz6335/mcp-server-aidatamarketplace` | Marketplace for agent data APIs — submit the endpoint |
| `0rkz/byte-mcp-server` | Per-byte data marketplace — publisher listing |
| `goodmeta/intelligence-mcp` | Tracks the agent-payments ecosystem — ask to be included |
| x402 Bazaar (CDP) | Already wired; our routes are discoverable |

**Opener:** short, factual, one paragraph: what the endpoint is, what it
costs ($0.001/call), that it settles through the Coinbase facilitator, and
the `/stats` link so they can verify the service is real.

## Tier 3 — paying clients and wallets (compatibility)

`forum-labs/payfetch`, `brianbooms/steward-mcp`, `up2itnow0822/clawpay-mcp`,
`bugiiiii11/rein`, `kevin2003050666-coder/x402-micro-tollgate`.

These are the buy side. They need live endpoints to test spend caps and
approval flows against.

**Opener:**

> Building the paying side of x402? Here's a live seller to test against:
> `https://stakechain-api.vercel.app/v1/yields` answers 402 with real
> requirements and settles through the Coinbase facilitator. $0.001 a call,
> real Base USDC. Happy to be your integration-test fixture — every payment
> shows up at /stats, so you can confirm settlement end to end.

## Tier 4 — complementary services (A2A)

`sukrutkrdg/x402-bazaar-mcp`, `true402/mcp-server`, `cyberwareX/cyberwarex-mcp`
(token safety, honeypot checks), `OceanAlt666/oceanalt-aml-mcp` (AML
screening), `Nikolife2016/pulsefeed-x402` (pre-payment safety).

Our API already resells upstream x402 sellers (`api/a2a.js`), so this is a
real two-way offer: we pay them per call to enrich our answers, they point
yield questions at us.

**Opener:**

> We pay other x402 sellers from inside our API (api/a2a.js) and resell the
> result — so this is a straight trade rather than a favour. If an agent
> asks us for <their domain>, we'd buy it from you per call; if your users
> ask about Base yields or whether a rate is stable, point them at
> `yield_history`. Want to try one call each way?

---

## Where else to post (no DM needed)

- **Base Discord** — #showcase, #developer-chat
- **Coinbase Developer Platform Discord** — the x402 channel
- **Farcaster** /base, /ai-agents (the cast is in ANNOUNCEMENT.md)
- **MCP community Discord** — tool announcements channel

## Tracking

Keep it in a plain table here: project, date contacted, channel, reply,
outcome. The metric that matters is not messages sent but **paying wallets
in `/stats` that aren't ours** — that number is still zero.

| Project | Date | Channel | Reply | Outcome |
|---|---|---|---|---|
| | | | | |
