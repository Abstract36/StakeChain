# STACH tokenomics

Audience: anyone evaluating the token — reviewers, risk scanners, people
deciding whether to hold it. Every figure here is readable on-chain; the
addresses are given so you can check rather than take our word.

Snapshot date: 2026-10-30. Supply figures move as liquidity and rewards
move; the contracts and schedules do not.

## Supply

Fixed at **42,000,000 STACH**. The contract has no mint function — the
figure cannot rise.

| Holder | Address | STACH | Share |
|---|---|---|---|
| Treasury / operations | [`0x2Ab5…6661`](https://basescan.org/address/0x2Ab5A19aabc599C1a24CC0541ECB757b56976661) | ~21.9M | 52.2% |
| Timelock (see below) | [`0x6425…D69C`](https://basescan.org/address/0x64253A048fFA0717d5f7F60afbdb6a7CCc04D69C#code) | 6.30M | 15.0% |
| Staking reward reserve, held by the token contract | [`0x82c5…7166`](https://basescan.org/address/0x82c5f9901CD9AEE3177053482b79aEA235507166) | 3.00M | 7.2% |
| Uniswap v4 STACH/ETH pool | [`0x4985…2b2b`](https://basescan.org/address/0x498581fF718922c3f8e6A244956aF099B2652b2b) | ~10.6M | 25.3% |
| Deployer / rewards wallet | [`0x2974…734F`](https://basescan.org/address/0x297423ed6e5f9c2177ab70ee3b80fd81000e734f) | ~0.1M | 0.24% |

**Roughly 74% is still under project control** (treasury + timelock +
reserve). That is the single largest risk in holding STACH, scanners are
right to flag it, and no amount of documentation changes it — only
distribution and time do.

## What is actually locked

- **Timelock, 6.3M (15%).** [`TreasuryTimelock`](../contracts/contracts/TreasuryTimelock.sol)
  releases nothing before **2027-04-28**, then linearly until
  **2028-10-19**. The contract has no owner, no pause and no recovery
  function: the schedule is the only way out, and anyone may call
  `release()` because the destination is fixed at construction.
- **Staking reward reserve, 3M (7.2%).** Held by the token contract and
  payable only to stakers, at a fixed per-second rate ending
  **2027-10-23** (1M flexible pool, 2M locked pool).
- **Nothing else.** The treasury can sell what it holds. Pool liquidity is
  not locked.

## Where value would come from

STACH has no governance rights. It is a claim on two things:

1. **Revenue share.** Machine consumers pay for the API in USDC over x402.
   Collected revenue is distributed to stakers through
   [`RevenueDistributor`](https://base.blockscout.com/address/0x2Ae03ea950db986207B15BC4ac6Cd9663F29b5D1)
   (deployed and verified; merkle epochs reproducible from public state).
   **This mechanism is built but carries no meaningful revenue yet** —
   [`/stats`](https://stakechain-api.vercel.app/stats) reports the real figure,
   including how much of it came from our own agent.
2. **Usage rewards.** External wallets that pay for API calls earn STACH
   back, weekly, from on-chain payment data. See the budget below.

If agents never pay meaningfully, neither mechanism produces anything.
That is the honest condition on the whole thesis.

## Usage-rewards budget

| Payment | Reward |
|---|---|
| $0.001 data request | 1 STACH |
| Developer subscription ($19) | 8,000 STACH |
| Professional subscription ($99) | 40,000 STACH |

- **Programme budget: 1,000,000 STACH (2.38% of supply), total.** The
  payout script refuses to distribute beyond it rather than continuing
  quietly; when it is spent the programme stops until rates are revised
  and republished.
- Per-run ceiling of 50,000 STACH on top of that.
- Project wallets are excluded, and the full payout history is committed
  to [`automation/cashback-ledger.json`](../automation/cashback-ledger.json).

Without a stated total, a per-call rate is indistinguishable from
unbounded emission — which is why the number is here rather than only in
the code.

## Known weaknesses

Listed because a reviewer will find them anyway, and finding them listed
says more than finding them hidden.

- **Concentration.** ~74% project-controlled; the treasury can sell.
- **Liquidity.** ~$4.9k in the pool against a ~$19k FDV. Thin enough that
  modest trades move the price, and it is not locked.
- **Unproven demand.** The revenue thesis rests on agents paying, and
  external paying wallets currently number zero.
- **Reward cliff.** Staking rewards run from a finite reserve to
  2027-10-23; after that, staking yield depends entirely on real revenue.
- **No sink.** Usage rewards and treasury sales add supply; nothing
  currently removes it. The budget above bounds the first, not the second.
- **Legacy origins.** The 2022 contract shipped with two critical bugs (a
  `transferFrom` that burned the recipient's balance, unbacked reward
  minting), fixed and regression-tested in 2026 —
  [audit](AUDIT-2026-10.md).

## Verify it yourself

- Balances: BaseScan or Blockscout, addresses above
- Timelock terms: `start()`, `cliff()`, `duration()`, `released()` on the
  verified contract
- Revenue: [`/stats`](https://stakechain-api.vercel.app/stats), recomputable from
  USDC transfers to the revenue wallet
- Reward payouts: the committed ledger in this repo

Nothing here is financial advice. STACH is an experiment token, and the
most likely outcome for any experiment is that it stays small.
