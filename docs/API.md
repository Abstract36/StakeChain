# API reference

Base URL: `https://stakechain-api.vercel.app`

Everything data-related is free and keyless. The paid tier exists for
volume and for agents that would rather pay per call than hold anything;
it is not a gate on the useful parts.

## Free endpoints

### `GET /yields`

Base staking and lending opportunities, biggest first.

```bash
curl 'https://stakechain-api.vercel.app/yields?limit=5'
```

| Query | Meaning |
|---|---|
| `asset` | Filter by symbol, e.g. `USDC` |
| `stable` | `true` for stablecoin pools only |
| `minTvl` | Minimum deposits in USD |
| `noIl` | `true` drops pools with impermanent-loss exposure |
| `maxApy` | APY ceiling, default 1000 — a four-digit rate is an emission schedule, not a yield. Raise it deliberately |
| `sort` | `apy` to rank by rate |
| `limit` | 1–100, default 25 |

The MCP tools use this free endpoint, so `npx -y stakechain-mcp` answers
real questions without a wallet. The paid `/v1/*` tier returns the
complete dataset without the 100-row cap.

Each pool carries `project`, `symbol`, `apy`, `tvlUsd`, `stablecoin`,
`ilRisk`, `pool` (its id, used by `/history`) and a link.

**Aave rows come from the Pool contract and the Aave oracle**, not from a
third-party snapshot — DefiLlama currently reports the Base USDC reserve,
~$172M supplied at ~9.4%, with zero TVL.

### `GET /vaults`

The deposit-ready shelf: Morpho ERC-4626 vaults and Aave V3 reserves in
one list, with the address to deposit to and a `risk` block (curator fee,
age in days, allocation concentration, how much of the APY is incentives).

### `GET /markets`

Morpho Blue borrow markets with the on-chain `MarketParams` needed to
transact.

### `GET /history?pool=<id>&days=30`

Daily APY/TVL series for one market, plus min, median, max, volatility and
how many observed days sat at or above today's rate.

```bash
curl 'https://stakechain-api.vercel.app/history?pool=vault:0x7bfa7c4f149e7415b73bdedfe609237e29cbf34a&days=30'
```

`pool` accepts a DefiLlama pool id, one of our ids (`aave-v3-base-usdc`),
or `vault:<address>`. Without `pool`, returns what the dataset covers.

Snapshots are committed to [`data/history/`](../data/history/) in the
public repo, so the series is verifiable and survives us. It started
2026-10-30 — a series cannot be backfilled, which is rather the point.

### `GET /profile?pool=<id>`

What to weigh besides the rate: size, track record, rate stability,
yield composition, curator fee, concentration — each with its own value,
plus a score and the weights used to derive it. Without `pool`, returns
the weights.

Scores are arithmetic over the values in the same response, so they can be
recomputed. A signal with no data yet is reported as unknown and dropped
from the weighting rather than guessed at.

### `GET /stats`

Settled x402 payments, unique payers and revenue, computed from USDC
transfers on Base with a BaseScan link. `internal_payments` counts calls
made by the project's own agent — self-generated traffic never reads as
demand.

### `GET /badge/<market>.svg`

Embeddable badge. See [BADGES.md](BADGES.md).

### `POST /mcp`

Hosted MCP endpoint (Streamable HTTP, stateless). Same tools as the npm
package, nothing to install.

## Paid endpoints (x402)

`/v1/yields`, `/v1/best?asset=<sym>`, `/v1/vaults` — the full dataset with
filters. **$0.001 per request**, USDC on Base, settled through the
Coinbase facilitator.

The flow is the x402 standard: an unpaid request returns `402` with
payment requirements, the client signs an EIP-3009 USDC authorization and
retries with an `X-PAYMENT` header. No accounts, no API keys, no invoices.
[`api/pay-client.js`](../api/pay-client.js) is a working reference client
in ~60 lines.

```bash
curl -i 'https://stakechain-api.vercel.app/v1/yields'   # 402 + requirements
```

### Subscriptions

`GET /v1/subscribe/developer` ($19) and `/v1/subscribe/professional` ($99)
are bought with a single x402 payment and return a signed key valid for 30
days. Send it as `X-API-KEY` on `/v1/*` to skip per-request payment.

Fair-use guidance rather than hard quotas for now: ~50k and ~500k requests
a month. If you are near either, tell us before you find out the hard way.

### Usage rewards

External wallets that pay earn STACH back — 1 per data call, 8,000 and
40,000 for the subscription tiers — out of a published 1,000,000 STACH
programme budget. Terms: [TOKENOMICS.md](TOKENOMICS.md).

## MCP tools

```json
{ "mcpServers": { "stakechain": { "command": "npx", "args": ["-y", "stakechain-mcp"] } } }
```

| Tool | Answers |
|---|---|
| `list_base_yields` | What is on offer on Base right now, filtered |
| `best_yield` | Highest APY for one asset, junk-farm filters applied |
| `list_lending_vaults` | The deposit-ready shelf with addresses |
| `yield_history` | Has this rate held, or did it appear yesterday? |
| `market_profile` | What should I weigh besides the rate? |

Env: `STAKECHAIN_API` to point at another instance.

## Limits and honesty

- Data refreshes every 5 minutes; badges are cached 5 minutes more.
- No rate limit is enforced on free endpoints yet. Please do not make us
  add one.
- Market data, not advice. Filters remove obvious traps (minimum TVL, APY
  ceiling, no-impermanent-loss default) but cannot make a market safe.
- Found something wrong? Open an issue — a data error is a bug here.
