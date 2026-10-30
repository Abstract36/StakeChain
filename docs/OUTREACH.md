# B2B outreach kit

Audience: builders who already ship x402 or MCP services. They understand
the protocol, so the pitch is one concrete thing we have that they don't —
not an introduction to agent payments.

**What we actually offer them**, in the order that lands:

1. **Data the aggregators get wrong.** DefiLlama has no Moonwell USDC
   market at all and reports Aave's Base USDC reserve at $413k against
   $175M on-chain — so anything built on that snapshot misses the two best
   USDC rates on Base. We read the protocols. Checkable in one call, which
   is why it opens well.
2. **An executable answer.** We return the contract to deposit into and
   handle three protocol interfaces, so an agent can act on the answer
   rather than only compare. The nearest competitor's own tool description
   says it is "not an executable deposit quote".
3. **Rate history** — daily APY/TVL with volatility, free. Useful, but
   table stakes rather than an edge: others ship it too
   ([COMPETITION.md](COMPETITION.md)). Offer it, do not lead with it.
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

## First five messages — ready to send

Written against what each repo actually says it does, checked 2026-10-30.
Send as a GitHub issue on their repo (public, searchable, no DM etiquette
problem) unless they list another channel. One per day is plenty; this is
not a campaign.

### 1. barkermoney/barker-mcp — closest peer, highest intent

*Stablecoin yield index, AI yield advisor, risk signals, x402 pay-per-call.
Active today.*

> **Subject:** Rate history for your yield advisor (free, no key)
>
> Hi — Barker and StakeChain are solving adjacent halves of the same
> problem, so this is an offer rather than a pitch.
>
> I run a Base yields API that started keeping a **daily APY/TVL series per
> market**: `GET /history?pool=<id>&days=30` returns min, median, max and
> volatility alongside the raw series. It exists because an advisor can't
> responsibly rank a 18% vault against an 8% one from spot rates alone —
> one Morpho vault I was testing slid 23.9% → 17.6% inside a day.
>
> It's free and keyless, and I'd rather it be used than hoarded:
> `npx -y stakechain-mcp` exposes it as `yield_history`, or hit the REST
> endpoint directly. If your advisor would want extra fields (drawdown,
> days-above-threshold, per-curator aggregation), say which and I'll add
> them — the collection is young enough to shape.
>
> One thing you may be able to use immediately regardless: DefiLlama
> reports Aave's Base USDC reserve — ~$172M supplied at ~9.4% — with zero
> TVL, so it's missing from anything that trusts their snapshot. We read
> the Pool contract and the Aave oracle instead.
>
> https://github.com/Abstract36/StakeChain — MIT, no token pitch attached.

### 2. gblinproject/GBLIN-MCP — parks idle USDC on Base

*Risk regime signals + a collateral-backed treasury index for idle USDC.*

> **Subject:** Which Base market to park in, and whether its rate is real
>
> Your treasury index needs to answer "where does idle USDC go this week" —
> that's exactly the question my API feeds.
>
> Free, keyless, no signup: the Base lending shelf (Morpho vaults + Aave V3
> reserves) with APY and TVL, plus a daily history per market so a rate can
> be checked for stability before allocation rather than after. Aave rates
> come from the Pool contract and oracle, not a third-party snapshot —
> DefiLlama currently shows the ~$172M Base USDC reserve at zero TVL.
>
> `npx -y stakechain-mcp` (tools: `list_lending_vaults`, `yield_history`).
> Happy to shape output for your JIT-swap flow if something's awkward.
>
> https://github.com/Abstract36/StakeChain

### 3. withgrokbot/verified-catalog — ask to be indexed

*Factual checks of x402 agent services. Active today.*

> **Subject:** Service to verify: StakeChain Base yields (x402, Base USDC)
>
> Submitting an endpoint for your catalog, with everything you'd need to
> check it:
>
> - Endpoint: `https://stakechain-api.vercel.app/v1/yields` — answers 402
>   with real requirements, settles through the Coinbase facilitator
> - Price: $0.001/call, USDC on Base. Subscriptions at /v1/subscribe/* for
>   $19 and $99 per 30 days
> - Free tier: `/yields`, `/vaults`, `/history`, and MCP at POST `/mcp`
> - Verification: `/stats` reports payments, payers and revenue computed
>   from on-chain transfers, with a BaseScan link. Our own agent's calls are
>   labeled `internal_payments` — at the time of writing every payment is
>   internal and the figure says so, which is the point.
> - Source: https://github.com/Abstract36/StakeChain (MIT)
>
> Tell me what else a factual check needs and I'll expose it.

### 4. forum-labs/payfetch — offer to be their test fixture

*Paying-fetch client with spend controls.*

> **Subject:** A live x402 seller to test spend caps against
>
> If you need a real seller for integration tests rather than a mock:
> `https://stakechain-api.vercel.app/v1/yields` answers 402 with genuine
> requirements and settles through the Coinbase facilitator. $0.001 a call,
> so a full test run costs cents.
>
> What makes it useful as a fixture: every settled payment appears at
> `/stats`, computed from chain data with a BaseScan link, so you can assert
> end to end that a payment actually landed rather than trusting a 200.
> There's also a $19/30d subscription route if you want to exercise a
> larger-amount path.
>
> Use it freely, no coordination needed. https://github.com/Abstract36/StakeChain

### 5. sukrutkrdg/x402-bazaar-mcp (or true402/mcp-server) — two-way trade

*Token safety and honeypot checks over x402.*

> **Subject:** We'd pay you per call — and send yield questions your way
>
> Our API already buys from other x402 sellers and resells the result
> (`api/a2a.js`), so this is a trade rather than a favour.
>
> When an agent asks us about a token we don't cover, we'd route the call to
> your safety checks and pay per request. In return, if your users ask
> whether a Base yield is real or a spike, point them at our `yield_history`
> tool — daily APY/TVL series with volatility, free and keyless.
>
> Want to try one call each way? https://github.com/Abstract36/StakeChain

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
| barkermoney/barker-mcp | 2026-10-30 | [issue #3](https://github.com/barkermoney/barker-mcp/issues/3) | — | awaiting |
| gblinproject/GBLIN-MCP | 2026-10-30 | [issue #6](https://github.com/gblinproject/gblin-treasury-risk-regime/issues/6) | — | awaiting |
| withgrokbot/verified-catalog | 2026-10-30 | [issue #47](https://github.com/withgrokbot/verified-catalog/issues/47) | — | awaiting |
| forum-labs/payfetch | 2026-10-30 | [issue #5](https://github.com/forum-labs/payfetch/issues/5) | — | awaiting |
| sukrutkrdg/x402-bazaar-mcp | 2026-10-30 | [issue #13](https://github.com/sukrutkrdg/x402-bazaar-mcp/issues/13) | — | awaiting |
