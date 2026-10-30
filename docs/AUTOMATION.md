# Self-reinforcing loops (network-effect automation)

Four mechanical loops that make usage compound. All state is public and
reproducible from chain data; the project's own traffic is always labeled.

## 1. Usage rewards (cashback) — `api/scripts/cashback.js`

Every external x402 payer earns STACH back, paid weekly from the rewards
wallet by `.github/workflows/cashback.yml`:

| Payment | Reward |
|---|---|
| $0.001 data request | 1 STACH |
| Developer subscription ($19) | 8,000 STACH |
| Professional subscription ($99) | 40,000 STACH |

- Payments are read from Base logs since the last run; the audit trail
  lives in `automation/cashback-ledger.json` (committed by the workflow).
- Project wallets (treasury, deployer, analyst) are excluded.
- Budget guard: a run refuses to distribute more than 50,000 STACH.
- Why: paying users become holders, treasury concentration falls through
  real usage, holders can stake and share x402 revenue — a closed loop.

## 2. Resident analyst — `api/scripts/analyst.js`

Daily (`analyst.yml`), the project's own agent **pays the public x402 API
with real USDC** and commits a yields digest to `reports/daily/`. Its
wallet is listed in `INTERNAL_PAYERS`, so `/stats` labels this traffic as
internal — self-generated usage never masquerades as demand.

## 3. A2A reselling — `api/a2a.js`

`/v1/yields?chain=<other>` is resold from another x402 seller when one is
registered in the `A2A_UPSTREAMS` env (JSON `{ "<chain>": "<url>" }`,
payer `A2A_PAYER_PK`). The service then participates in the machine
economy as a customer too: it pays upstream on-chain and passes the data
through with the settlement attached. No upstream registered = clean 501.

## 4. Cross-chain reward delivery

A payer listed in `automation/reward-chains.json` as `"arbitrum"` gets the
cashback bridged through the LayerZero OFT adapter instead of on Base —
rewards arrive on the chain where the agent lives.

## Setup

GitHub repo → Settings → Secrets and variables → Actions:

- secret `ANALYST_PK` — key of the analyst wallet (needs USDC on Base; the
  reference payer wallet works).
- secret `REWARDS_PK` — key of the rewards wallet (needs STACH for payouts
  and a little Base ETH for gas; for Arbitrum deliveries also LZ fees).
- variable `INTERNAL_PAYERS` — comma-separated analyst/internal addresses;
  set the same value in Vercel env so `/stats` labels them.

Both workflows exit cleanly with a notice when their secret is absent.
