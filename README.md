# StakeChain — resurrected

StakeChain is a staking platform built around the STACH token (fixed supply 42M), with two built-in staking pools:

- **Flexible pool** — stake/unstake any time, 1M STACH rewards over 360 days.
- **Locked pool** — 1–6 month locks with time-weighted rewards, 2M STACH over 360 days.

This repository is the 2026 resurrection of the 2021–2023 project, consolidated from archives, with the contract **audited and hardened** (see [docs/AUDIT-2026-10.md](docs/AUDIT-2026-10.md)).

## Layout

| Folder | What it is |
|---|---|
| [contracts/](contracts/) | Hardhat project: `STACH` token + staking (hardened), tests, deploy scripts |
| [dashboard/](dashboard/) | React (MUI + thirdweb) user dashboard with staking/pools scenes |
| [website-static/](website-static/) | Static marketing site (free to host on GitHub Pages) |
| [website-laravel/](website-laravel/) | Legacy Laravel marketing site (kept for reference) |
| [docs/](docs/) | Technical documentation, whitepaper PDFs, audit notes |
| [branding/](branding/) | Logos and promo imagery |
| [workspace-configs/](workspace-configs/) | VS Code workspace profiles from the original project |

## Cheap-by-design deployment

The goal is a near-zero launch budget:

- **Chain: Base** (or Polygon PoS / BNB Chain) — deploying this contract costs cents. Test for free on **Base Sepolia**.
- **Admin wallet** (initial holder of the 39M supply, same address on Base/Polygon/BNB/ETH): `0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`.
- **Frontend**: the React dashboard deploys to Vercel/GitHub Pages free tier.
- **Marketing site**: `website-static/` on GitHub Pages — $0 hosting.
- **RPC**: public endpoints are preconfigured; no paid plan needed.

### Quickstart

```bash
cd contracts
npm install
npx hardhat test                 # 25 tests
cp .env.example .env             # add PRIVATE_KEY
npm run deploy:baseSepolia       # free testnet deploy
npm run deploy:base              # mainnet (costs cents)
```

Then put the deployed address into `dashboard/.env` (`REACT_APP_STACH_ADDRESS`) and run `npm start` inside `dashboard/`.

## Security

The original 2022 contract contained two critical bugs (a `transferFrom` that destroyed recipient balances, and unbacked reward minting that broke the total-supply invariant). Both are fixed and covered by regression tests in [contracts/test/fortress.js](contracts/test/fortress.js). Details: [docs/AUDIT-2026-10.md](docs/AUDIT-2026-10.md).

> Note: secrets found in the old archives (an Infura key and a throwaway private key) were stripped from this repository and its history. Rotate any keys you ever used with this project.
