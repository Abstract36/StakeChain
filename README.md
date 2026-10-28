# StakeChain Labs

[![CI](https://github.com/Abstract36/StakeChain/actions/workflows/ci.yml/badge.svg)](https://github.com/Abstract36/StakeChain/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/stakechain-mcp?label=stakechain-mcp)](https://www.npmjs.com/package/stakechain-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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
| [api/](api/) | Base yields aggregator (DefiLlama source, 5-min cache, junk-farm filters) with x402 machine-payment endpoints |
| [agents/](agents/) | MCP server exposing yields as AI-agent tools + resident-analyst pattern (Claude Agent SDK) |
| [dashboard/](dashboard/) | React dashboard: **Base Yields** table, STACH staking, pools |
| [contracts/](contracts/) | `STACH` token + flexible/locked staking — audited & hardened ([audit](docs/AUDIT-2026-10.md)), 25 tests |
| [website/](website/) | Landing page (static, GitHub-Pages-ready) |

Legacy 2021–2023 material (Laravel site, old static site, branding, original
docs) is kept under [website-laravel/](website-laravel/),
[website-static/](website-static/), [branding/](branding/), [docs/](docs/).

## Monetization: machines pay, on-chain, automatically — LIVE

Human endpoints (`/yields`, `/vaults`) are free. Machine endpoints
(`/v1/*`) speak the [x402 protocol](https://x402.org) **with enforcement
on**: HTTP `402` + payment requirements → the client signs an EIP-3009
USDC authorization ($0.001/request) → our self-hosted settler verifies the
signature and submits it on-chain (no facilitator, no accounts, no API
keys). Revenue lands at the admin wallet; `api/pay-client.js` is a reference
paying client.

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
npx hardhat test                              # 25 tests
npm run deploy:baseSepolia                    # free testnet
```

## STACH token

**Deployed at the same address on both networks** (verified via Sourcify, exact match):

- **Base mainnet:** [`0x82c5f9901CD9AEE3177053482b79aEA235507166`](https://basescan.org/token/0x82c5f9901CD9AEE3177053482b79aEA235507166) · [Blockscout](https://base.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)
- **Base Sepolia:** [`0x82c5f9901CD9AEE3177053482b79aEA235507166`](https://base-sepolia.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)

Initial holder / admin: `0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`. The
dashboard targets mainnet by default; set `REACT_APP_CHAIN=baseSepolia` for
the testnet.

Fixed supply 42M. 3M held by the contract as the staking reward reserve
(1M flexible / 2M locked over 360 days), 39M to the admin wallet. The 2022
contract had two critical bugs (recipient-burning `transferFrom`, unbacked
reward minting) — fixed and regression-tested in 2026:
[docs/AUDIT-2026-10.md](docs/AUDIT-2026-10.md).

Future revenue-share to STACH stakers is deliberately **not built yet** —
revenue first, distribution second.

### Supply transparency

Every STACH is accounted for (snapshot 2026-10-28, verify on-chain):

| Holder | Address | STACH | Share |
|---|---|---|---|
| Treasury / operations (funds future liquidity and the experiment) | [`0x2Ab5…6661`](https://basescan.org/address/0x2Ab5A19aabc599C1a24CC0541ECB757b56976661) | ~38.98M | 92.8% |
| Staking reward reserve (3M) + user stakes, held by the token contract | [`0x82c5…7166`](https://basescan.org/address/0x82c5f9901CD9AEE3177053482b79aEA235507166) | ~3.00M | 7.2% |
| Uniswap v4 STACH/ETH pool | [`0x4985…2b2b`](https://basescan.org/address/0x498581fF718922c3f8e6A244956aF099B2652b2b) | ~14.4k | 0.03% |
| Deployer (deploys contracts, holds no tokens) | [`0x2974…734F`](https://basescan.org/address/0x297423ed6e5f9c2177ab70ee3b80fd81000e734f) | 0 | 0% |
| Other holders | — | ~11.5k | 0.03% |

Nothing is vesting-locked yet; a treasury timelock is planned once pool
liquidity justifies it and will be linked here when deployed. Scanner
flags about holder concentration are accurate — this table is the context
behind them.

## Honest part

This is an experiment, not "the future of finance". Everything here is
MIT-licensed, the audit is public, the data endpoints filter out obvious
degen traps (min TVL, APY ceiling, no-IL default). Nothing in this
repository is financial advice.
