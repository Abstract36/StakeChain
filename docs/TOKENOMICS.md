# STACH tokenomics

Audience: anyone evaluating the token — reviewers, risk scanners, people
deciding whether to hold it. Every figure here is readable on-chain; the
addresses are given so you can check rather than take our word.

Snapshot date: 2026-11-02. Supply figures move as liquidity and rewards
move; the contracts and schedules do not.

## Supply

Fixed at **42,000,000 STACH**. The contract has no mint function — the
figure cannot rise.

| Holder | Address | STACH | Share |
|---|---|---|---|
| Dutch-auction contract (see below) | [`0xBd0c…FecC7`](https://basescan.org/address/0xBd0cF4CfC82eFd31F8F0a5972A651DF694DFEcC7) | 12.21M | 29.08% |
| Uniswap v4 pool initializer (see below) | [`0xf101…6000`](https://basescan.org/address/0xf10124B01E9fa88b0a2eF3fA95a53B3310446000) | 12.21M | 29.08% |
| Uniswap v4 STACH/ETH pool | [`0x4985…2b2b`](https://basescan.org/address/0x498581fF718922c3f8e6A244956aF099B2652b2b) | 8.14M | 19.39% |
| Timelock (see below) | [`0x6425…D69C`](https://basescan.org/address/0x64253A048fFA0717d5f7F60afbdb6a7CCc04D69C#code) | 6.30M | 15.00% |
| Staking reward reserve + user stakes, held by the token contract | [`0x82c5…7166`](https://basescan.org/address/0x82c5f9901CD9AEE3177053482b79aEA235507166) | 3.03M | 7.22% |
| Deployer / rewards wallet | [`0x2974…734F`](https://basescan.org/address/0x297423ed6e5f9c2177ab70ee3b80fd81000e734f) | 0.10M | 0.24% |
| Treasury / operations | [`0x2Ab5…6661`](https://basescan.org/address/0x2Ab5A19aabc599C1a24CC0541ECB757b56976661) | **0** | 0% |

Figures are rounded to two decimals, so the columns may not add to exactly
42,000,000 / 100%. The unrounded balances do: 12,213,362.698 + 12,213,362.698
+ 8,142,242.51 + 6,300,000 + 3,031,000 + 100,014 + 18.09 of dust across five
addresses = 42,000,000.

**Roughly 80% has never been in public hands** (auction 29.08% + pool
initializer 29.08% + timelock 15% + reward reserve 7.22%). The treasury
wallet itself now holds nothing. That concentration is the single largest
risk in holding STACH, scanners are right to flag it, and no amount of
documentation changes it — only distribution and time do.

The 19.39% in the Uniswap v4 pool is liquidity, not a holding: it is
withdrawable by whoever owns the position, and the position is not locked.

## What is actually locked

- **Timelock, 6.3M (15%).** [`TreasuryTimelock`](../contracts/contracts/TreasuryTimelock.sol)
  releases nothing before **2027-04-28**, then linearly until
  **2028-10-19**. The contract has no owner, no pause and no recovery
  function: the schedule is the only way out, and anyone may call
  `release()` because the destination is fixed at construction.
- **Staking reward reserve, 3M (7.2%).** Held by the token contract and
  payable only to stakers, at a fixed per-second rate ending
  **2027-10-23** (1M flexible pool, 2M locked pool).
- **Nothing else.** The 58.16% in the auction and its pool initializer is
  committed to sale on terms not yet published here (see below). Pool
  liquidity is not locked, and the treasury wallet now holds nothing to
  sell.


## The 2026-10-31 auction

On **2026-10-31 at 10:50 UTC**, in one batched transaction
([`0x9f0c7dbe…`](https://basescan.org/tx/0x9f0c7dbe5a216acf54103cadad31e25c76a372e5be0cfc217161c03c41da428d)) signed by the treasury wallet,
**24,426,725.40 STACH — 58.16% of supply — left the treasury** and was
split exactly in half between two contracts created or configured by that
transaction:

| Contract | What the chain shows |
|---|---|
| [`0xBd0cF4Cf…`](https://basescan.org/address/0xBd0cF4CfC82eFd31F8F0a5972A651DF694DFEcC7) | 12,213,362.70 STACH. Deployed by this transaction through the canonical CREATE2 deployer. Emits `AuctionCreated`, `AuctionStepRecorded`, `ClearingPriceUpdated`, `TickInitialized`, `NextActiveTickUpdated` and `TokensReceived` — a **gradual Dutch auction across Uniswap v4 ticks**. |
| [`0xf10124B0…`](https://basescan.org/address/0xf10124B01E9fa88b0a2eF3fA95a53B3310446000) | 12,213,362.70 STACH. Reports `poolManager()` = the Uniswap v4 PoolManager and `positionManager()` = the v4 PositionManager, and emits `InitializerCreated`: a **pool initializer** for the auction. |

The same transaction set a Permit2 approval and called `multicall(bytes[])`
on a distribution router, which emitted `TokenDistributed`.

**What is honestly not established.** Neither contract is verified on a
public explorer, neither answers `name()` or `symbol()`, and the launch
service used is not identified here — so the auction's **terms (start, end,
reserve price, and whether unsold tokens can be reclaimed) are not
documented in this file.** The only auction state readable from outside is
`clearingPrice()`. Until those terms are published, treat that 58.16% as
committed to sale on terms this document cannot yet state.

**Nothing has sold.** As of 2026-11-02 both contracts still hold their full
12,213,362.698 STACH and have made **zero outgoing transfers** since the
split. The treasury wallet holds 0 STACH, 1.09 USDC and 0.004 ETH.

**The treasury wallet is now a smart account.** `0x2Ab5…6661` carries 23
bytes of code — an EIP-7702 delegation designator pointing at
`0x63c0c19a282a1b52b07dd5a65b58948a07dae32b`. It is still the x402 revenue
wallet named in [`/stats`](https://stakechain-api.vercel.app/stats), and
the delegation persists until explicitly revoked.

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

- **Concentration.** ~80% has never been in public hands, and 58.16% of it
  sits in an auction whose terms are not published here. See
  [the 2026-10-31 auction](#the-2026-10-31-auction).
- **Liquidity.** ~$4.9k in the pool against a ~$19k FDV. Thin enough that
  modest trades move the price, and it is not locked.
- **Unproven demand.** The revenue thesis rests on agents paying. Two
  external wallets have ever paid, both of them catalogue-sweeper bots that
  bought once each; total external revenue is $0.002.
- **Auction with no bids.** As of 2026-11-02 the auction holding 29.08% of
  supply has sold nothing in the two days since it opened.
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
