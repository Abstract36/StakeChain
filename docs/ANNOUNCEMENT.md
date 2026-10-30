# Launch announcement — ready-to-post copy

Audience: Base builders, DeFi-curious devs, and people building AI agents
that move money. Tone: honest experiment, proof over promises. Every claim
below is checkable on-chain or in the repo — keep it that way when editing.

**Lead with what others cannot do, not with rate history.** Several agent
yield servers already ship history and volatility (see
[COMPETITION.md](COMPETITION.md)); what none of them return is the contract
to deposit into, and what aggregator-sourced ones cannot see is the two
best USDC rates on Base — Moonwell's USDC market is absent from DefiLlama
entirely, and Aave's is reported at $413k against $175M on-chain.

Suggested venues, in order of expected return:

1. **Farcaster** — channels /base, /dev, /ai-agents. Native Base audience,
   the people actually playing with x402.
2. **Discord** — Base server (#showcase / #developer-chat) and the Coinbase
   Developer Platform server (x402 channel).
3. **X** — lower signal, but the thread doubles as a link to paste elsewhere.
4. **Reddit** r/BaseChain, HN Show HN — only if the above get traction.

---

## Farcaster: main cast (~900 chars, fits one long cast)

> I rebuilt my dead 2022 token project as an open experiment on Base 🧪
>
> StakeChain Labs is a yields aggregator with two kinds of users:
> • humans — a dashboard of Base staking/lending rates, with Morpho and
>   Aave deposits in-app
> • AI agents — the same data as MCP tools, paid per request in USDC over
>   x402
>
> Two things I didn't expect to find while building it:
>
> 1. DefiLlama reports Aave's Base USDC reserve — ~$172M supplied at ~9.4% —
>    with zero TVL, so the best stablecoin rate on the chain is invisible in
>    most aggregators. We read the Pool contract instead.
> 2. Nobody cheaply answers "has this APY held, or did it appear yesterday?".
>    One vault slid 23.9% → 17.6% in a single day while I was testing. So we
>    snapshot every market daily into the public repo.
>
> No presale, no roadmap promises. MIT, audit in the repo, 15% of supply in
> a verified timelock.
>
> App: stakechain-app.vercel.app
> Code: github.com/Abstract36/StakeChain

## Follow-up casts (thread)

**2/** For agent builders: `npx -y stakechain-mcp` gives any MCP client live
Base yields tools, including `yield_history` — daily APY/TVL series with
volatility, so an agent can tell a stable rate from a spike before it
allocates. Free tier, no API key.

**3/** The paid tier speaks x402: HTTP 402 → sign a USDC authorization on
Base → retry. Settled through Coinbase's facilitator, no accounts, no
invoices. $0.001 a call, or $19/month if you'd rather hold a key. Every
payment and every cent of revenue is public at /stats, computed from chain
data.

**4/** The honest part: the 2022 contract shipped with two criticals — a
`transferFrom` that burned the recipient's balance, and unbacked reward
minting. The audit that found them is in the repo. Read code before
trusting it, mine included. STACH is an experiment token, not an
investment.

---

## Discord (Base / CDP servers) — shorter, dev-first

> Built an open-source yields aggregator on Base that AI agents pay for over
> x402: `npx -y stakechain-mcp` for the MCP tools, or REST with HTTP 402 →
> USDC → retry (Coinbase facilitator, no API keys).
>
> Two bits that might be useful regardless of the token side:
> • Aave's Base USDC reserve shows as $0 TVL in DefiLlama while actually
>   holding ~$172M at ~9.4% — we read the Pool + oracle directly, so it
>   shows up.
> • Daily APY/TVL snapshots of every tracked market go into the public repo,
>   so `yield_history` can say whether a rate is typical or a spike.
>
> MIT, audit and supply breakdown in the repo:
> github.com/Abstract36/StakeChain

---

## X thread

**1/** Rebuilt my dead 2022 token as an open DeFi-data experiment on Base.

Aggregator of staking + lending yields. Humans get a dashboard. AI agents
get MCP tools and pay per request in USDC over x402.

Everything MIT, everything checkable:
github.com/Abstract36/StakeChain

**2/** Found a hole while building: DefiLlama reports Aave's Base USDC
reserve with ZERO TVL. It actually holds ~$172M at ~9.4% — the best
stablecoin rate on Base, invisible in aggregators.

We read the Pool contract and the Aave oracle instead.

**3/** Second hole: no one cheaply answers "has this APY held, or did it
appear yesterday?"

A vault I was testing went 23.9% → 17.6% in a day.

So every tracked market is snapshotted daily into the public repo. Agents
query it as `yield_history` and get min / median / max / volatility.

**4/** The token side, briefly: audited (2 criticals found and fixed), 15%
of supply in a verified timelock, supply broken down wallet by wallet on the
site, bridged to Arbitrum over LayerZero at the same address.

No presale. No promises. An experiment.

---

## Russian version (для RU-каналов)

> Поднял свой мёртвый проект 2022 года как открытый эксперимент на Base.
>
> Агрегатор доходностей: людям — дашборд со ставками Base и депозитами в
> Morpho и Aave, AI-агентам — те же данные как MCP-инструменты с оплатой
> за запрос в USDC по x402.
>
> Два наблюдения из процесса:
> • DefiLlama показывает резерв Aave USDC на Base с нулевым TVL, хотя там
>   ~$172M под ~9.4% — лучшая стейбл-ставка сети просто не видна в
>   агрегаторах. Мы читаем контракт напрямую.
> • Никто дёшево не отвечает на вопрос «эта ставка держалась или появилась
>   вчера?». Одно хранилище при мне сползло с 23.9% до 17.6% за сутки.
>   Поэтому снимки всех рынков ежедневно ложатся в публичный репозиторий.
>
> Без пресейла и обещаний. MIT, аудит в репозитории, 15% эмиссии в
> верифицированном таймлоке.
>
> github.com/Abstract36/StakeChain

---

## Checklist before posting

- [ ] Dashboard deployed and the domain points at it (the deploy and the
      domain are separate steps — verify the live bundle, not the build log)
- [ ] `/stats`, `/history` and `/yields` all answering
- [ ] At least a few days of snapshots in `data/history/` so `yield_history`
      returns something worth looking at
- [ ] `stakechain-mcp` published at the version the post mentions
- [ ] Nothing in the post that isn't checkable — no projected yields, no
      "first/best", no implied returns
