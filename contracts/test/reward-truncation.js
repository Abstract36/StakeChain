// Reported by KupiaSec on 2026-11-02 against the deployed contract, verified,
// then fixed here.
//
// WHAT WAS WRONG. _syncPool advanced lastUpdatedTime on every call while what
// it added to yieldRewardsPerWeight was an integer division,
// `secondsPassed * rewardsRate * 1e12 / totalLockedWeight`, whose remainder
// was discarded. A flexible stake weighs 1e6 * amount, so the increment came
// to about `32,150 * seconds / STACH staked` and the loss grew with how often
// the pool was synced — and processRewards() is external, needing no stake and
// no role, so anybody could sync both pools every block.
//
// Measured against live state on 2026-11-02 (24,500 STACH flexible, weight
// 2.45e28): a two-second sync accrued 603 where the exact figure was 789 —
// 23.57% gone. Past `seconds * 32,150` STACH staked, 64,300 at one Base block,
// the increment was zero while the seconds were still consumed.
//
// THE FIX. _syncPool now carries the remainder into the next sync, so the
// division happens against an accumulated numerator rather than a fresh one.
// These tests state the properties that fix has to hold, not the symptom it
// removed: the emission must not depend on sync frequency, and nothing must be
// lost at any stake size.
//
// NOTE. The instance on Base at 0x82c5f9901CD9AEE3177053482b79aEA235507166
// predates this change and cannot be upgraded. These tests describe the source
// as it stands for any future deployment; see docs/AUDIT-2026-10.md.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const parse = ethers.utils.parseEther;
const BN = ethers.BigNumber.from;
const SCALE = BN(10).pow(12);

describe("STACH staking — reward accumulator precision", function () {
  let owner, staker, stranger;

  beforeEach(async () => {
    [owner, staker, stranger] = await ethers.getSigners();
  });

  async function staked(stakeAmount) {
    const s = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    await s.connect(owner).transfer(staker.address, stakeAmount);
    await s.connect(staker).approve(s.address, stakeAmount);
    await s.connect(staker).stakeInFlexible(stakeAmount);
    return { s, start: (await s.flexiblePool()).lastUpdatedTime };
  }

  // Everything the pool has accounted for since `start`: what it placed into
  // the accumulator, plus what it is still carrying.
  async function accounted(s, start) {
    const pool = await s.flexiblePool();
    const placed = pool.yieldRewardsPerWeight.mul(pool.totalLockedWeight);
    const carried = await s.flexibleRewardRemainder();
    const elapsed = pool.lastUpdatedTime.sub(start);
    return { placed, carried, elapsed, rate: pool.rewardsRate, pool };
  }

  it("nothing is lost: placed plus carried equals seconds times rate, exactly", async () => {
    // The invariant the fix exists for. Deliberately at a stake where the old
    // code lost all of it.
    const { s, start } = await staked(parse("70000"));
    for (let i = 0; i < 20; i++) {
      await ethers.provider.send("evm_increaseTime", [2]);
      await s.connect(stranger).processRewards();
    }
    const { placed, carried, elapsed, rate } = await accounted(s, start);
    const owed = elapsed.mul(rate).mul(SCALE);

    expect(placed.add(carried).toString()).to.equal(owed.toString());
    expect(placed.gt(0), "nothing accrued at all — the fix did not take").to.equal(true);
  });

  it("the emission does not depend on how often anyone syncs", async () => {
    // The griefing vector: a stranger calling processRewards() every block
    // used to cost the pool a quarter of its emission at the live stake, and
    // all of it above the threshold. Both runs cover the same span.
    const amount = parse("24500");

    const a = await staked(amount);
    for (let i = 0; i < 300; i++) {
      await ethers.provider.send("evm_increaseTime", [2]);
      await a.s.connect(stranger).processRewards();
    }
    const often = await accounted(a.s, a.start);

    const b = await staked(amount);
    // Set the next block's timestamp outright. `evm_increaseTime` is an offset
    // the next block consumes, so arithmetic on it lands a second out and the
    // two runs would cover different spans — which is how this comparison
    // reported a 50% "loss" that was only the harness miscounting.
    await ethers.provider.send("evm_setNextBlockTimestamp", [
      b.start.add(often.elapsed).toNumber(),
    ]);
    await b.s.connect(stranger).processRewards();
    const once = await accounted(b.s, b.start);

    expect(often.elapsed.toString()).to.equal(once.elapsed.toString());
    console.log(
      `        300 syncs: ${often.pool.yieldRewardsPerWeight}  |  one sync: ${once.pool.yieldRewardsPerWeight}  |  carried ${often.carried}`
    );
    // Identical, bar the one unit the frequent run may still be carrying.
    const gap = once.pool.yieldRewardsPerWeight.sub(often.pool.yieldRewardsPerWeight);
    expect(gap.lte(1) && gap.gte(-1), `accumulators differ by ${gap}`).to.equal(true);
    expect(often.placed.add(often.carried).toString()).to.equal(
      once.placed.add(once.carried).toString()
    );
  });

  it("a staker is paid the same whether a stranger syncs every block or never", async () => {
    // The same property in money rather than in the accumulator, which is the
    // form the claim was reported in.
    const amount = parse("24500");
    const claimable = async (grief) => {
      const { s } = await staked(amount);
      if (grief) {
        for (let i = 0; i < 100; i++) {
          await ethers.provider.send("evm_increaseTime", [2]);
          await s.connect(stranger).processRewards();
        }
      } else {
        await ethers.provider.send("evm_increaseTime", [199]);
        await ethers.provider.send("evm_mine", []);
      }
      await s.connect(staker).processRewards();
      return s.rewards(staker.address);
    };

    const griefed = await claimable(true);
    const quiet = await claimable(false);
    console.log(`        griefed: ${ethers.utils.formatEther(griefed)} STACH  |  quiet: ${ethers.utils.formatEther(quiet)} STACH`);
    expect(griefed.gt(0), "the staker earned nothing — test proves nothing").to.equal(true);
    // Within a hair: the two runs cannot land on identical block timestamps.
    const diff = quiet.sub(griefed).abs().mul(10000).div(quiet).toNumber();
    expect(diff).to.be.lessThan(200); // under 2%
  });

  it("the smallest stake the contract allows does not strand the emission", async () => {
    // The opposite end from a large pool. 1 STACH is the floor both pools
    // enforce, which is also what bounds every magnitude here: it keeps the
    // weight at or above 1e24, so the accumulator cannot grow large enough to
    // overflow anything downstream.
    const { s, start } = await staked(parse("1"));
    await ethers.provider.send("evm_increaseTime", [120]);
    await s.connect(stranger).processRewards();
    const { placed, carried, elapsed, rate } = await accounted(s, start);
    expect(placed.add(carried).toString()).to.equal(elapsed.mul(rate).mul(SCALE).toString());
  });

  it("the arithmetic the thresholds were computed from", async () => {
    // Guards the premise rather than the symptom: if the rate, the weight
    // multiplier or the 1e12 scale ever change, the numbers quoted in the
    // header and in docs/AUDIT-2026-10.md stop describing this contract.
    const { s } = await staked(parse("1"));
    const pool = await s.flexiblePool();
    expect(pool.rewardsRate.toString()).to.equal("32150205761316872");
    expect(pool.totalLockedWeight.toString()).to.equal(BN(10).pow(24).toString());
    const locked = await s.lockedPool();
    expect(locked.rewardsRate.toString()).to.equal("64300411522633744");
  });
});
