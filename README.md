# StakeChain Labs

[![CI](https://github.com/Abstract36/StakeChain/actions/workflows/ci.yml/badge.svg)](https://github.com/Abstract36/StakeChain/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/stakechain-mcp?label=stakechain-mcp)](https://www.npmjs.com/package/stakechain-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![stakechain-mcp MCP server – quality and maintenance score on Glama](https://glama.ai/mcp/servers/Abstract36/StakeChain/badges/score.svg)](https://glama.ai/mcp/servers/Abstract36/StakeChain)

**Live:** [landing](https://abstract36.github.io/StakeChain/) ·
[dashboard](https://stakechain-app.vercel.app) ·
[API](https://stakechain-api.vercel.app/yields) ·
[contract on BaseScan](https://basescan.org/token/0x82c5f9901CD9AEE3177053482b79aEA235507166) ·
[Blockscout](https://base.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)

**STACH is tradeable:** Uniswap v4 pool STACH/ETH live on Base (initial
price 4,000,000 STACH/ETH) — routable through aggregators (LI.FI verified).

**An open staking-yield experiment on Base.** Live aggregator of staking and
lending rates across Base protocols — readable by humans on a dashboard,
consumable by AI agents over MCP, payable by machines over x402.

No seed round. No token presale. Just a running, open-source experiment.
Concept and plan: [docs/PIVOT-2026.md](docs/PIVOT-2026.md).

## The product

| Piece | What it does |
|---|---|
| [api/](api/) | Base yields aggregator with junk-farm filters, rate history and market profiles. Aave and Moonwell are read from their own contracts, not a third-party snapshot; x402 machine-payment endpoints |
| [agents/](agents/) | MCP server (5 tools, on npm) + runnable [recipes](agents/recipes/) + a resident analyst that pays the public API for its own data |
| [dashboard/](dashboard/) | React dashboard: Base Yields, Earn (Morpho, Aave, Moonwell), Borrow, Swap, STACH staking, Portfolio |
| [contracts/](contracts/) | `STACH` token + flexible/locked staking — audited & hardened ([audit](docs/AUDIT-2026-10.md)), plus the treasury timelock — 38 tests |
| [website/](website/) | Landing page (static, GitHub-Pages-ready) |

Legacy 2021–2023 material (Laravel site, old static site, branding, original
docs) is kept under [website-laravel/](website-laravel/),
[website-static/](website-static/), [branding/](branding/), [docs/](docs/).

## Monetization: machines pay, on-chain, automatically — LIVE

Human endpoints (`/yields`, `/vaults`) are free. Machine endpoints
(`/v1/*`) speak the [x402 protocol](https://x402.org) **with enforcement
on**: HTTP `402` + payment requirements → the client signs an EIP-3009
USDC authorization ($0.001/request) → it settles on-chain through the
Coinbase facilitator, with our own EIP-3009 settler as the fallback (no
accounts, no API keys either way). Revenue lands at the admin wallet; `api/pay-client.js` is a reference
paying client.

**Embeddable badges:** live rates as SVG for any README — see
[docs/BADGES.md](docs/BADGES.md). No key, no signup.

![Aave USDC](https://stakechain-api.vercel.app/badge/aave-usdc.svg)
![Spark USDC](https://stakechain-api.vercel.app/badge/sparkusdc.svg)
![x402 payments](https://stakechain-api.vercel.app/badge/stats.svg)

**API reference:** [docs/API.md](docs/API.md) — endpoints, the x402 flow,
MCP tools and what each one answers.

**Rate history:** [`/history?pool=<id>&days=30`](https://stakechain-api.vercel.app/history)
answers the question a live APY cannot — has this rate held, or did it
appear yesterday? Daily snapshots are committed to
[`data/history/`](data/history/) in this repo, so the series is verifiable
and survives us. Agents get it as the `yield_history` tool.

**Pricing:** $0.001/request (pure x402), or subscriptions bought with a
single x402 payment — Developer $19/30d, Professional $99/30d (`GET
/v1/subscribe/<tier>` returns a signed `X-API-KEY` that skips per-request
payments). **Public stats:** [`/stats`](https://stakechain-api.vercel.app/stats)
reports payment counts and revenue computed from on-chain USDC transfers —
verifiable by anyone on BaseScan.

**Real yield:** collected USDC is distributed to STACH stakers through
[`RevenueDistributor`](https://base.blockscout.com/address/0x2Ae03ea950db986207B15BC4ac6Cd9663F29b5D1)
(verified; merkle epochs reproducible from public state via
`contracts/scripts/revenue-snapshot.js`, 180-day sweep-back).

## MCP config

The yields aggregator is an MCP server, published on npm as
[`stakechain-mcp`](https://www.npmjs.com/package/stakechain-mcp). Add it to
any MCP-compatible client:

```json
{
  "mcpServers": {
    "stakechain": { "command": "npx", "args": ["-y", "stakechain-mcp"] }
  }
}
```

## Quickstart

```bash
# 1. Yields API
cd api && npm install && npm start            # :4000

# 2. Dashboard
cd dashboard && npm install --legacy-peer-deps
npm start                                     # :3000, reads the API

# 3. Give the data to your AI agent (published on npm, no clone needed)
claude mcp add stakechain -- npx -y stakechain-mcp

# 4. Contracts (test + cheap deploy)
cd contracts && npm install
npx hardhat test                              # 38 tests
npm run deploy:baseSepolia                    # free testnet
```

## STACH token

**Deployed at the same address on both networks** (verified via Sourcify, exact match):

- **Base mainnet:** [`0x82c5f9901CD9AEE3177053482b79aEA235507166`](https://basescan.org/token/0x82c5f9901CD9AEE3177053482b79aEA235507166) · [Blockscout](https://base.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)
- **Arbitrum One (canonical wrapped, LayerZero OFT):** same address, [`0x82c5…7166`](https://arbiscan.io/token/0x82c5f9901CD9AEE3177053482b79aEA235507166) — real STACH stays locked on Base ([bridge docs](docs/BRIDGE.md))
- **Base Sepolia:** [`0x82c5f9901CD9AEE3177053482b79aEA235507166`](https://base-sepolia.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)

Initial holder / admin: `0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`. The
dashboard targets mainnet by default; set `REACT_APP_CHAIN=baseSepolia` for
the testnet.

Fixed supply 42M. At deployment: 3M held by the contract as the staking
reward reserve (1M flexible / 2M locked over 360 days), 39M to the admin
wallet — the table below shows where it sits now. The 2022
contract had two critical bugs (recipient-burning `transferFrom`, unbacked
reward minting) — fixed and regression-tested in 2026:
[docs/AUDIT-2026-10.md](docs/AUDIT-2026-10.md).

The distributor above is deployed and verified, but **carries no meaningful
revenue yet** — [`/stats`](https://stakechain-api.vercel.app/stats) reports the
real figure, including how much came from our own agent. Revenue first,
distribution second: the mechanism exists so it can be checked, not because
there is something to distribute.

### Supply transparency

Full detail, including lock schedules and the usage-rewards budget:
[docs/TOKENOMICS.md](docs/TOKENOMICS.md).

Every STACH is accounted for (snapshot 2026-10-30, verify on-chain):

| Holder | Address | STACH | Share |
|---|---|---|---|
| Treasury / operations (funds future liquidity and the experiment) | [`0x2Ab5…6661`](https://basescan.org/address/0x2Ab5A19aabc599C1a24CC0541ECB757b56976661) | ~21.93M | 52.2% |
| **Timelocked treasury** — locked until 2027-04-28, linear to 2028-10-19, no owner and no recovery path | [`0x6425…D69C`](https://basescan.org/address/0x64253A048fFA0717d5f7F60afbdb6a7CCc04D69C#code) | 6.30M | 15.0% |
| Staking reward reserve (3M) + user stakes, held by the token contract | [`0x82c5…7166`](https://basescan.org/address/0x82c5f9901CD9AEE3177053482b79aEA235507166) | ~3.00M | 7.2% |
| Uniswap v4 STACH/ETH pool | [`0x4985…2b2b`](https://basescan.org/address/0x498581fF718922c3f8e6A244956aF099B2652b2b) | ~10.64M | 25.3% |
| Deployer (deploys contracts, pays usage rewards) | [`0x2974…734F`](https://basescan.org/address/0x297423ed6e5f9c2177ab70ee3b80fd81000e734f) | ~100k | 0.24% |

15% sits in a [verified timelock](https://basescan.org/address/0x64253A048fFA0717d5f7F60afbdb6a7CCc04D69C#code)
with no owner, no pause and no recovery function, and 7.2% is the staking
reward reserve the token contract can only pay to stakers. The treasury
wallet can still sell what it holds, so concentration flags remain fair —
this table exists so the claim can be checked rather than trusted.

## Honest part

This is an experiment, not "the future of finance". Everything here is
MIT-licensed, the audit is public, the data endpoints filter out obvious
degen traps (min TVL, APY ceiling, no-IL default). Nothing in this
repository is financial advice.
