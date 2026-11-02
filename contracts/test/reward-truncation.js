// Reported by KupiaSec on 2026-11-02, verified here before answering.
//
// _syncPool advances lastUpdatedTime on every call, but the amount it adds to
// yieldRewardsPerWeight is an integer division:
//
//   increment = secondsPassed * rewardsRate * 1e12 / totalLockedWeight
//
// A flexible stake weighs 1e6 * amount, so 1 STACH is 1e24 of weight, and at
// the flexible rate of 3.215e16 wei/s the increment is about
// 32,150 * seconds / STACH staked. The remainder of that division is not
// carried: the seconds are consumed and the fraction is gone. The loss is
// therefore proportional to how often the pool is synced — and processRewards()
// is external, with no access control and no stake required, so anybody can
// sync both pools every block.
//
// Live state read on 2026-11-02: 24,500 STACH in the flexible pool, which
// makes a 2-second sync lose about 24% of those two seconds' emission. These
// tests pin that number and the point where it reaches 100%.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const parse = ethers.utils.parseEther;
const BN = ethers.BigNumber.from;

describe("STACH staking — reward accumulator truncation", function () {
  let stach, owner, staker, stranger;

  beforeEach(async () => {
    [owner, staker, stranger] = await ethers.getSigners();
    stach = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
  });

  // A fresh deployment with `stakeAmount` staked flexible, returning the pool
  // and the block timestamp the accumulator starts from.
  async function staked(stakeAmount) {
    const s = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    await s.connect(owner).transfer(staker.address, stakeAmount);
    await s.connect(staker).approve(s.address, stakeAmount);
    await s.connect(staker).stakeInFlexible(stakeAmount);
    return { s, start: (await s.flexiblePool()).lastUpdatedTime };
  }

  /**
   * The frequent run goes first and reports how much time it actually covered;
   * the single-sync run is then made to cover exactly the same span. Driving
   * it the other way round does not work: `evm_increaseTime` is an offset the
   * next block consumes rather than an addition to it, so a loop of
   * increaseTime + tx advances by one second per iteration, not two. Comparing
   * accumulators over different spans would have shown a 50% "loss" that is
   * only the harness miscounting.
   */
  async function compare({ stakeAmount, syncs, step }) {
    const a = await staked(stakeAmount);
    for (let i = 0; i < syncs; i++) {
      await ethers.provider.send("evm_increaseTime", [step]);
      await a.s.connect(stranger).processRewards();
    }
    const oftenPool = await a.s.flexiblePool();
    const elapsed = oftenPool.lastUpdatedTime.sub(a.start).toNumber();

    const b = await staked(stakeAmount);
    await ethers.provider.send("evm_increaseTime", [elapsed - 1]);
    await b.s.connect(stranger).processRewards();
    const oncePool = await b.s.flexiblePool();

    return {
      once: { perWeight: oncePool.yieldRewardsPerWeight, elapsed: oncePool.lastUpdatedTime.sub(b.start) },
      often: { perWeight: oftenPool.yieldRewardsPerWeight, elapsed: BN(elapsed) },
    };
  }

  it("a stranger syncing every block costs the flexible pool a quarter of its emission", async () => {
    // 24,500 STACH is what the live pool holds. 600 seconds of emission,
    // taken either in one step or in 2-second steps as a griefer would.
    const { once, often } = await compare({
      stakeAmount: parse("24500"),
      syncs: 300,
      step: 2,
    });

    // Same elapsed span on both runs, or the comparison means nothing.
    expect(often.elapsed.toNumber()).to.be.closeTo(once.elapsed.toNumber(), 2);
    expect(often.elapsed.toNumber()).to.be.greaterThan(100);

    const lostPct =
      once.perWeight.sub(often.perWeight).mul(10000).div(once.perWeight).toNumber() / 100;
    console.log(
      `        one sync: ${once.perWeight}  |  2s syncs: ${often.perWeight}  |  lost ${lostPct}%`
    );
    expect(often.perWeight.lt(once.perWeight), "truncation did not happen — test is vacuous").to
      .equal(true);
    expect(lostPct).to.be.greaterThan(15);
    expect(lostPct).to.be.lessThan(35);
  });

  it("above ~64,300 STACH a two-second sync accrues nothing at all", async () => {
    // The threshold is where secondsPassed * rate * 1e12 < totalLockedWeight,
    // i.e. stake > seconds * 32,150 STACH. The live pool is 2.6x short of it,
    // so this is what more deposits would buy: an emission of exactly zero.
    const stakeAmount = parse("70000");
    await stach.connect(owner).transfer(staker.address, stakeAmount);
    await stach.connect(staker).approve(stach.address, stakeAmount);
    await stach.connect(staker).stakeInFlexible(stakeAmount);

    const before = await stach.flexiblePool();
    await ethers.provider.send("evm_increaseTime", [1]);
    await stach.connect(stranger).processRewards(); // 2 seconds total
    const after = await stach.flexiblePool();

    expect(after.lastUpdatedTime.gt(before.lastUpdatedTime), "time did not move").to.equal(true);
    expect(after.yieldRewardsPerWeight.toString()).to.equal(
      before.yieldRewardsPerWeight.toString()
    );
    console.log(
      `        ${after.lastUpdatedTime.sub(before.lastUpdatedTime)}s consumed, accumulator unchanged at ${after.yieldRewardsPerWeight}`
    );
  });

  it("the skipped emission stays in the reserve, which nothing can pay out", async () => {
    // Where the money goes matters: the contract has no owner and no upgrade
    // path, so an under-paid emission is not merely delayed, it is stranded.
    const stakeAmount = parse("70000");
    await stach.connect(owner).transfer(staker.address, stakeAmount);
    await stach.connect(staker).approve(stach.address, stakeAmount);
    await stach.connect(staker).stakeInFlexible(stakeAmount);

    const reserveBefore = await stach.rewardTokens();
    for (let i = 0; i < 30; i++) {
      await ethers.provider.send("evm_increaseTime", [1]);
      await stach.connect(stranger).processRewards();
    }
    expect((await stach.rewardTokens()).toString()).to.equal(reserveBefore.toString());
    expect((await stach.flexiblePool()).yieldRewardsPerWeight.toString()).to.equal("0");
  });

  it("the arithmetic matches what the deployed contract will do", async () => {
    // Guards the premise rather than the symptom: if a future change alters
    // the rate, the weight multiplier or the 1e12 scale, the thresholds above
    // are no longer the right numbers and this test says so.
    const pool = await stach.flexiblePool();
    expect(pool.rewardsRate.toString()).to.equal("32150205761316872");

    await stach.connect(owner).transfer(staker.address, parse("1"));
    await stach.connect(staker).approve(stach.address, parse("1"));
    await stach.connect(staker).stakeInFlexible(parse("1"));
    // 1 STACH of flexible stake weighs 1e6 * 1e18
    expect((await stach.flexiblePool()).totalLockedWeight.toString()).to.equal(
      BN(10).pow(24).toString()
    );
  });
});
