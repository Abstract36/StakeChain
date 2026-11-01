// Property tests for the accounting in RevenueDistributor.
//
// The existing suite checks named scenarios. These check that no *sequence*
// of legal operations can break the arithmetic: epochs are funded, claimed
// in arbitrary order, partially abandoned and swept, and after every single
// step the books have to balance. That is the part where a bug costs money
// rather than correctness points — the contract holds other people's USDC
// and the only thing standing between a claimant and someone else's share
// is this arithmetic.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const leafOf = (account, amount) =>
  ethers.utils.keccak256(
    ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [account, amount])
    )
  );
const hashPair = (a, b) =>
  ethers.utils.keccak256(
    ethers.utils.concat([a, b].sort((x, y) => (x.toLowerCase() < y.toLowerCase() ? -1 : 1)))
  );

function buildTree(leaves) {
  let level = [...leaves].sort();
  const levels = [level];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? hashPair(level[i], level[i + 1]) : level[i]);
    }
    level = next;
    levels.push(level);
  }
  const proofFor = (leaf) => {
    const proof = [];
    let idx = levels[0].indexOf(leaf);
    for (let l = 0; l < levels.length - 1; l++) {
      const sib = idx ^ 1;
      if (sib < levels[l].length) proof.push(levels[l][sib]);
      idx = Math.floor(idx / 2);
    }
    return proof;
  };
  return { root: level[0], proofFor };
}

// Deterministic PRNG: a failing run has to be reproducible from its seed,
// otherwise a property test is just a flaky test.
const rng = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const SWEEP_DELAY = 180 * 24 * 60 * 60;
const BN = ethers.BigNumber.from;
const parse = ethers.utils.parseEther;

describe("RevenueDistributor — accounting invariants", function () {
  let usdc, dist, owner, claimants;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    claimants = signers.slice(1, 6);
    usdc = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    dist = await (
      await ethers.getContractFactory("RevenueDistributor")
    ).deploy(usdc.address, owner.address);
    await usdc.approve(dist.address, parse("10000000"));
  });

  // The books, as the test believes them to be. Every assertion below
  // compares the chain against this, not against itself.
  const ledger = { deposited: BN(0), paid: BN(0), swept: BN(0) };

  async function checkInvariants(epochs) {
    const held = await usdc.balanceOf(dist.address);

    let outstanding = BN(0);
    for (let i = 0; i < epochs.length; i++) {
      const e = await dist.epochs(i);
      // I1: an epoch can never pay out more than it was funded with.
      expect(e.claimedTotal.lte(e.total), `epoch ${i} overdrawn`).to.equal(true);
      outstanding = outstanding.add(e.total.sub(e.claimedTotal));
    }

    // I2 (solvency): everything still owed is still here. If this breaks,
    // some claimant with a valid proof cannot be paid.
    expect(held.gte(outstanding), "insolvent: owes more than it holds").to.equal(true);

    // I3 (conservation): nothing is created or destroyed. Every unit that
    // went in is either paid out, swept back, or still sitting in the
    // contract — the three are exhaustive and must not overlap.
    expect(held.add(ledger.paid).add(ledger.swept).eq(ledger.deposited), "books do not balance")
      .to.equal(true);
  }

  async function fundEpoch(shares) {
    const leaves = shares.map(([s, amt]) => leafOf(s.address, amt));
    const tree = buildTree(leaves);
    const total = shares.reduce((acc, [, amt]) => acc.add(amt), BN(0));
    await dist.addEpoch(tree.root, total, 1);
    ledger.deposited = ledger.deposited.add(total);
    return { tree, total, shares, claimed: new Set() };
  }

  it("holds under randomised sequences of funding, claiming and sweeping", async function () {
    this.timeout(120000);
    for (const seed of [1, 7, 42, 1337]) {
      // fresh books per seed
      const signers = await ethers.getSigners();
      usdc = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
      dist = await (
        await ethers.getContractFactory("RevenueDistributor")
      ).deploy(usdc.address, owner.address);
      await usdc.approve(dist.address, parse("10000000"));
      ledger.deposited = BN(0);
      ledger.paid = BN(0);
      ledger.swept = BN(0);

      const rand = rng(seed);
      const epochs = [];
      // Same guard as the staking walk: a sequence that only ever hits the
      // revert branch proves nothing about the arithmetic it is meant to
      // exercise, so count what actually ran.
      const did = { claimed: 0, rejected: 0, swept: 0, empty: 0 };

      for (let round = 0; round < 3; round++) {
        // fund an epoch for a random subset, with random shares
        const picked = claimants.filter(() => rand() > 0.3);
        if (picked.length === 0) picked.push(claimants[0]);
        const shares = picked.map((s) => [s, parse(String(1 + Math.floor(rand() * 100)))]);
        epochs.push(await fundEpoch(shares));
        await checkInvariants(epochs);

        // claim a random subset, in a random order, from any open epoch
        for (let step = 0; step < 6; step++) {
          const id = Math.floor(rand() * epochs.length);
          const e = epochs[id];
          const idx = Math.floor(rand() * e.shares.length);
          const [signer, amount] = e.shares[idx];
          const key = `${id}:${signer.address}`;
          const leaf = leafOf(signer.address, amount);
          const proof = e.tree.proofFor(leaf);

          if (e.claimed.has(key)) {
            // I4: a second claim must revert, never pay twice
            await expect(dist.connect(signer).claim(id, amount, proof)).to.be.revertedWith(
              "already claimed"
            );
            did.rejected++;
          } else {
            const before = await usdc.balanceOf(signer.address);
            await dist.connect(signer).claim(id, amount, proof);
            const after = await usdc.balanceOf(signer.address);
            // I5: a claim pays exactly the amount in the tree, no more
            expect(after.sub(before).eq(amount), "claim paid the wrong amount").to.equal(true);
            e.claimed.add(key);
            did.claimed++;
            ledger.paid = ledger.paid.add(amount);
          }
          await checkInvariants(epochs);
        }
      }

      // sweep everything that aged out, and check the remainder is exact
      await ethers.provider.send("evm_increaseTime", [SWEEP_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);
      for (let id = 0; id < epochs.length; id++) {
        const e = await dist.epochs(id);
        const left = e.total.sub(e.claimedTotal);
        if (left.isZero()) {
          await expect(dist.sweep(id)).to.be.revertedWith("nothing left");
          did.empty++;
          continue;
        }
        const before = await usdc.balanceOf(owner.address);
        await dist.sweep(id);
        const after = await usdc.balanceOf(owner.address);
        // I6: a sweep returns exactly what was never claimed
        expect(after.sub(before).eq(left), "sweep returned the wrong amount").to.equal(true);
        ledger.swept = ledger.swept.add(left);
        did.swept++;
        // I7: and cannot run twice
        await expect(dist.sweep(id)).to.be.revertedWith("nothing left");
        await checkInvariants(epochs);
      }

      // I0 (not vacuous): a run that never paid a claim, never refused a
      // second one and never swept has not tested the arithmetic at all.
      for (const branch of ["claimed", "rejected", "swept"]) {
        expect(did[branch], `seed ${seed}: ${branch} never executed — test is vacuous`)
          .to.be.greaterThan(0);
      }

      // I8: once every epoch is fully claimed or swept, nothing is stranded
      const held = await usdc.balanceOf(dist.address);
      expect(held.isZero(), `seed ${seed}: ${held} USDC stranded`).to.equal(true);
    }
  });
});
