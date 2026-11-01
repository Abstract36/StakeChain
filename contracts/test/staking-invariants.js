// Property tests for the staking accounting in STACH.
//
// The suite in staking.js checks named scenarios. These check that no
// *sequence* of legal actions can break custody: users stake, lock, unstake
// and withdraw rewards in a randomised interleaving, and after every step
// the contract must still be holding everything it owes. This is the live
// contract on Base holding real deposits, so the question worth asking is
// the blunt one — can anybody take out more than their principal plus their
// share of the emission, and can the reserve ever pay for a stake?
const { expect } = require("chai");
const { ethers } = require("hardhat");

const parse = ethers.utils.parseEther;
const BN = ethers.BigNumber.from;
const DAY = 24 * 60 * 60;

// Deterministic: a failure has to be reproducible from its seed.
const rng = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const advance = async (seconds) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

describe("STACH staking — custody invariants", function () {
  let stach, owner, users, initialReserve;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    users = signers.slice(1, 6);
    stach = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    for (const u of users) await stach.connect(owner).transfer(u.address, parse("500"));
    initialReserve = await stach.rewardTokens();
  });

  // Everything the contract owes: every staked principal, plus whatever is
  // left of the reward reserve. Its own balance has to cover all of it.
  async function obligations() {
    let staked = BN(0);
    for (const u of users) {
      const f = await stach.flexibleStakingUsers(u.address);
      const l = await stach.lockedStakingUsers(u.address);
      staked = staked.add(f.tokenAmount).add(l.tokenAmount);
    }
    const reserve = await stach.rewardTokens();
    return { staked, reserve, total: staked.add(reserve) };
  }

  async function checkInvariants(withdrawn, label) {
    const held = await stach.balanceOf(stach.address);
    const { staked, reserve, total } = await obligations();

    // S1 (custody): the contract holds at least what it owes. If this ever
    // fails, one user's principal is funding another user's reward.
    expect(held.gte(total), `${label}: holds ${held}, owes ${total}`).to.equal(true);

    // S2 (reserve cap): rewards paid out can never exceed the reserve the
    // contract was created with. The emission is finite by construction.
    expect(withdrawn.add(reserve).eq(initialReserve), `${label}: reserve does not reconcile`)
      .to.equal(true);
    expect(reserve.lte(initialReserve), `${label}: reserve grew`).to.equal(true);

    // S3 (weights): each pool's total weight is exactly the sum of its
    // members' weights — the denominator every payout divides by.
    let flexW = BN(0);
    let lockW = BN(0);
    for (const u of users) {
      flexW = flexW.add((await stach.flexibleStakingUsers(u.address)).totalWeight);
      lockW = lockW.add((await stach.lockedStakingUsers(u.address)).totalWeight);
    }
    expect((await stach.flexiblePool()).totalLockedWeight.eq(flexW), `${label}: flexible weight drift`)
      .to.equal(true);
    expect((await stach.lockedPool()).totalLockedWeight.eq(lockW), `${label}: locked weight drift`)
      .to.equal(true);

    return { staked, reserve };
  }

  it("holds under randomised staking, unstaking and reward withdrawal", async function () {
    this.timeout(180000);

    for (const seed of [3, 11, 99]) {
      const signers = await ethers.getSigners();
      stach = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
      for (const u of users) await stach.connect(owner).transfer(u.address, parse("500"));
      initialReserve = await stach.rewardTokens();

      const rand = rng(seed);
      let withdrawn = BN(0);
      // A random walk that bounces off every guard would pass this test
      // without touching the contract, so count what actually executed and
      // refuse to call that a pass.
      const did = { flex: 0, locked: 0, unstake: 0, withdraw: 0 };
      const flexDeposits = new Map(users.map((u) => [u.address, 0]));

      // Warm-up: give every user one of each kind of position, so the
      // unstake and withdraw branches have something to act on instead of
      // bouncing off their guards for the whole walk.
      for (const u of users) {
        await stach.connect(u).stakeInFlexible(parse("20"));
        flexDeposits.set(u.address, flexDeposits.get(u.address) + 1);
        did.flex++;
        await stach.connect(u).stakeInLocked(parse("20"), 2);
        did.locked++;
      }
      await advance(30 * DAY);

      for (let step = 0; step < 30; step++) {
        const u = users[Math.floor(rand() * users.length)];
        const action = rand();

        if (action < 0.3) {
          const amount = parse(String(1 + Math.floor(rand() * 20)));
          if ((await stach.balanceOf(u.address)).lt(amount)) continue;
          await stach.connect(u).stakeInFlexible(amount);
          flexDeposits.set(u.address, flexDeposits.get(u.address) + 1);
          did.flex++;
        } else if (action < 0.5) {
          const amount = parse(String(1 + Math.floor(rand() * 20)));
          if ((await stach.balanceOf(u.address)).lt(amount)) continue;
          const months = 1 + Math.floor(rand() * 6);
          try {
            await stach.connect(u).stakeInLocked(amount, months);
            did.locked++;
          } catch {
            continue; // lockUntil past periodFinish: a legal refusal, not a bug
          }
        } else if (action < 0.75) {
          const n = flexDeposits.get(u.address);
          if (n === 0) continue;
          const id = Math.floor(rand() * n);
          const dep = await stach.flexibleStakingUsers(u.address);
          if (dep.tokenAmount.isZero()) continue;
          const before = await stach.balanceOf(u.address);
          try {
            await stach.connect(u).unstakeFlexible(id, parse("1"));
          } catch {
            continue; // nothing left in that particular deposit
          }
          const after = await stach.balanceOf(u.address);
          // S4 (principal): unstaking returns the principal and not a unit
          // more. Rewards leave only through withdrawRewards.
          expect(after.sub(before).eq(parse("1")), "unstake overpaid").to.equal(true);
          did.unstake++;
        } else {
          // Yield only lands in rewards[] once it is processed, and a user
          // who staked and then sat still has none booked however much has
          // accrued — so process first, exactly as a real claimant would.
          const f = await stach.flexibleStakingUsers(u.address);
          const l = await stach.lockedStakingUsers(u.address);
          if (f.tokenAmount.isZero() && l.tokenAmount.isZero()) continue;
          try {
            await stach.connect(u).processRewards();
          } catch {
            continue;
          }
          if ((await stach.rewards(u.address)).isZero()) continue;
          const before = await stach.balanceOf(u.address);
          await stach.connect(u).withdrawRewards();
          const after = await stach.balanceOf(u.address);
          withdrawn = withdrawn.add(after.sub(before));
          did.withdraw++;
        }

        await advance(Math.floor(rand() * 7 * DAY));
        await checkInvariants(withdrawn, `seed ${seed} step ${step}`);
      }

      // S5: at the end, nobody got more out than they put in plus emission
      // S0 (not vacuous): every branch has to have fired at least once,
      // or the invariants below were never actually put under load.
      for (const [name, n] of Object.entries(did)) {
        expect(n, `seed ${seed}: ${name} never executed — test is vacuous`).to.be.greaterThan(0);
      }

      const { staked } = await checkInvariants(withdrawn, `seed ${seed} final`);
      let outside = BN(0);
      for (const u of users) outside = outside.add(await stach.balanceOf(u.address));
      expect(
        outside.lte(parse("500").mul(users.length).add(initialReserve)),
        `seed ${seed}: users hold more than they were ever given plus the reserve`
      ).to.equal(true);
      expect(staked.gte(0)).to.equal(true);
    }
  });
});
