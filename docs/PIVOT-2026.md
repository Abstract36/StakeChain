# StakeChain pivot — 2026 transformation plan

## Why the pivot

The 2021–2023 concept ("hybrid multichain DeFi hub": swap, bridge, lending,
insurance, escrow, …) had thirteen products and zero revenue sources. The
analysis (2026-10-28) concluded: closed-loop tokenomics (stake STACH to earn
STACH), no protocol income, and a positioning ("no KYC") that is a liability
under MiCA/CARF. Full analysis lives in the project history.

## The new concept in one sentence

**A niche, open-source staking-yields aggregator for Base, built to be
consumed by AI agents and paid for by machines.**

### Three legs

1. **Product**: live aggregator of staking/LST/lending rates on Base
   (`api/` + dashboard `Base Yields` scene). Narrow, useful, honest.
2. **Monetization — fully automated on-chain**: human dashboard traffic is
   free; machine consumers (AI agents, bots, integrators) pay per request in
   USDC on Base via the **x402 protocol** (HTTP 402 + `X-PAYMENT`).
   No accounts, no invoices, no payment processor: revenue settles straight
   to the admin wallet `0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`.
3. **AI agents live inside the product** (`agents/`): an MCP server exposes
   the data as tools; a scheduled Agent SDK "resident analyst" can watch
   rates and publish alerts. Agents are both consumers (paying via x402) and
   staff (running the product).

### Where STACH fits

STACH stays as the experiment's native token (audited, hardened, cheap to
deploy on Base). Its long-term value path is **real yield**: once x402
revenue exists, a future revenue-share contract routes a portion of USDC
income to STACH stakers. That contract is deliberately **not built yet** —
building distribution before revenue was the 2021 mistake.

## Positioning rules (marketing)

- "Open experiment", never "the future of finance".
- No "no-KYC" claims anywhere.
- Every claim must be verifiable in the repo (audit, tests, code).
- Nothing is financial advice; junk-farm filters stay on in agent-facing
  endpoints (min TVL, APY ceiling).

## Repo visibility

The repo was published 2026-10-28 and then set **private** the same day —
the old generic marketing and 13-product scope should not be the public
first impression. Relaunch checklist before flipping public again
(`gh repo edit Abstract36/StakeChain --visibility public --accept-visibility-change-consequences`):

- [x] New landing (`website/`) replaces legacy sites as the entry point
- [x] Dashboard trimmed to Yields / STACH Staking / Pools / Analytics
- [x] README reflects the experiment positioning
- [x] Legacy Laravel site moved out or clearly marked as archive (ARCHIVE.md)
- [x] STACH deployed to Base Sepolia: 0x82c5f9901CD9AEE3177053482b79aEA235507166
- [ ] Basescan source verification (needs ETHERSCAN_API_KEY)
- [ ] Hosting live per docs/DEPLOY.md (Vercel x2 + GitHub Pages)

## Launch sequence (near-zero budget)

1. **Now**: API + MCP server run locally; dashboard on Vercel/Pages free tier;
   landing on GitHub Pages. Cost: $0.
2. **Testnet**: deploy STACH to Base Sepolia (free), wire the dashboard
   staking scene to it.
3. **Soft mainnet**: deploy STACH to Base (cents), publish repo, announce as
   an open experiment in Base/AI-agent communities (x402 is a Coinbase
   protocol — the Base ecosystem is the natural audience).
4. **Revenue switch**: when agent traffic exists, wire the x402 facilitator,
   set `X402_ENFORCE=true`, publish revenue dashboards (on-chain, verifiable).
5. **Only after revenue**: design the STACH revenue-share contract, audit it,
   ship it.
