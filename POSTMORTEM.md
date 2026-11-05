# Post-mortem: StakeChain Labs

**Retired 2026-11-05.** Nothing here is maintained. The schedules are off, the
code is MIT, and the measurements below are the part worth keeping.

This is written for whoever finds this repository and wonders whether to use,
fork or repeat it — including its own author, later.

## What it was

A Base DeFi yields aggregator: rates read from Aave and Moonwell contracts
directly, a React dashboard, an MCP server for AI agents (5 tools, on npm), a
tamper-evident rate history, and x402 endpoints so machines could pay per call
in USDC. An ERC-20 (`STACH`) with flexible and locked staking, audited and
hardened, 38 tests. No seed round, no presale.

It worked. All of it. That turned out not to be the question.

## Why it is dead

**The market it was built for does not have buyers.** Measured by sweeping the
entire CDP Bazaar discovery index (113,225 resource records, 3,315 distinct
sellers), not a sample:

| | |
|---|---|
| Total x402 seller revenue, 30 days | **$96,010.63** (~$3,200/day) |
| Sellers earning under $1/month | 2,736 of 3,315 |
| Sellers earning $1,000/month or more | 5 |
| StakeChain's own revenue | **$0.008/month** |

And the headline figure is mostly not what it looks like. `api.bitrefill.com`
alone accounts for 71.9% of it — $69,000 from **69 calls at $1,000 each** on a
route called `/x402/invoice/pay`. That is a checkout rail for gift cards, not
an API sale. Strip the merchandise, the bank transfers, and the sellers paying
their own endpoints (one host has seven listings with exactly one call each,
including a $190 endpoint named `bazaar-keepalive`), and real third-party API
fees across the whole market come to roughly **$22,000/month** — nearly half of
it a single seller.

The pricing lesson is sharper than the totals. `blockrun.ai` earned $477.81
from 109,866 calls. `mudko.com` earned $744.95 from 8. Everyone selling data at
$0.001–0.005 earns hundreds of dollars on six-figure call volumes; everyone
earning real money is selling goods or money movement at $1–$1,000 a call. At
our $0.001 price, $1,000/month required a million paid calls. The entire market
does about 1.1 million.

There is no price at which this product earns. That is not a traffic problem or
a marketing problem, and no amount of shipping would have fixed it.

## Three times the data contradicted us

Kept here because the corrections are more useful than the conclusions.

1. **"CDP stopped counting our calls."** False — a sampling error. Measuring
   the whole index showed 52% of all hosts were staler than 48 hours and we sat
   at the 44th percentile. The mechanism: `lastUpdated` tracks `lastCalledAt` to
   within a second on every host, so a record is only ever touched by a counted
   settlement, never by a crawl. A support ticket was drafted and dropped.
2. **"The top of this market is mostly self-dealt."** False. Only 6 hosts
   (21.3% of calls) fit the pattern; 55 hosts with 20 or more unique payers hold
   57% of volume.
3. **"There are live contracts with the accumulator-truncation bug worth
   reporting for bounties."** False. Every mainnet deployment of the shape had
   dead emission: ApeX ended 2022-08-26, Degis has had `degisPerSecond = 0`
   since 2024-12, the Elixir pools hold zero stake. Zero live targets.

Each of these was asserted with more confidence than the evidence supported,
and each was retired by widening the measurement from a sample to the whole
population. That is the only method in this repository that consistently paid.

## What was actually fixed, and is worth reading

- [`api/attest.js`](api/attest.js) and [`api/scripts/attest.js`](api/scripts/attest.js) —
  an append-only hash chain over the daily rate history, verifiable offline by
  anyone. Pure, dependency-injected, 14 tests, mutation-checked. Five days are
  recorded. See [`docs/ATTESTATION.md`](docs/ATTESTATION.md), including the
  section on what it never managed to prove.
- [`api/stats.js`](api/stats.js) — one bad RPC response used to silently lose a
  whole day of payment data. Now retries with backoff across multiple
  endpoints, and an unreadable chain raises instead of reading as "no
  payments". 6 tests. Hours after shipping this, the market-sweep script
  written to analyse the market died on the identical bug, because it had no
  retry. The fix is easy; noticing you need it is not.
- The daily workflow now commits the snapshot even when a later step fails.
  Before that, any failure downstream discarded data already collected.
- [`docs/TOKENOMICS.md`](docs/TOKENOMICS.md) — the published supply table said
  the treasury held 52.2%. It holds nothing. Roughly 80% of supply has never
  been in public hands; 58% sits in a Dutch auction over Uniswap v4 ticks,
  identified from its event signatures alone. The tables were materially false
  in public for weeks.

## What to do differently

1. **Measure whether anyone pays before building the thing they would pay
   for.** Four days of sweeps answered that for x402. They would have cost the
   same four days before writing the aggregator, and saved the rest.
2. **Sweep the population, not a sample.** Every wrong conclusion above came
   from a sample; every correction came from the full index.
3. **A test that does not fail when you remove the fix proves nothing.** Both
   test suites added here were mutation-checked for exactly that.
4. Money in this domain does not arrive per call and does not arrive from
   users. It arrives from institutions with a mandate and a procurement budget.
   Pricing and traffic are downstream of that and cannot substitute for it.
