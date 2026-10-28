# StakeChain Labs

**Live:** [landing](https://abstract36.github.io/StakeChain/) ·
[dashboard](https://stakechain-app.vercel.app) ·
[API](https://stakechain-api.vercel.app/yields) ·
[contract](https://base.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)

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

## Monetization: machines pay, on-chain, automatically

Human dashboard traffic is free. Machine consumers (AI agents, bots,
integrators) hit `/v1/*` endpoints that speak the
[x402 protocol](https://x402.org): HTTP `402` + payment requirements →
the agent pays USDC on Base → retries with `X-PAYMENT`. No accounts, no
API keys, no invoices. Revenue settles directly to the admin wallet
(`0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`).

While the experiment bootstraps, `X402_ENFORCE=false` keeps everything free.

## Quickstart

```bash
# 1. Yields API
cd api && npm install && npm start            # :4000

# 2. Dashboard
cd dashboard && npm install --legacy-peer-deps
npm start                                     # :3000, reads the API

# 3. Give the data to your AI agent
cd agents/mcp-server && npm install
claude mcp add stakechain -- node agents/mcp-server/server.js

# 4. Contracts (test + cheap deploy)
cd contracts && npm install
npx hardhat test                              # 25 tests
npm run deploy:baseSepolia                    # free testnet
```

## STACH token

**Deployed at the same address on both networks** (verified via Sourcify, exact match):

- **Base mainnet:** [`0x82c5f9901CD9AEE3177053482b79aEA235507166`](https://base.blockscout.com/address/0x82c5f9901CD9AEE3177053482b79aEA235507166)
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

## Honest part

This is an experiment, not "the future of finance". Everything here is
MIT-licensed, the audit is public, the data endpoints filter out obvious
degen traps (min TVL, APY ceiling, no-IL default). Nothing in this
repository is financial advice.
