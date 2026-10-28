const { expect } = require("chai");
const { ethers } = require("hardhat");

// Minimal OZ StandardMerkleTree-compatible helpers:
// leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))))
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

describe("RevenueDistributor", function () {
  let usdc, dist, owner, alice, bob, carol;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();
    // a plain ERC20 stands in for USDC
    usdc = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    dist = await (
      await ethers.getContractFactory("RevenueDistributor")
    ).deploy(usdc.address, owner.address);
    await usdc.approve(dist.address, ethers.utils.parseEther("1000000"));
  });

  const makeEpoch = async (claims) => {
    const leaves = claims.map(([a, amt]) => leafOf(a.address, amt));
    const tree = buildTree(leaves);
    const total = claims.reduce((s, [, amt]) => s.add(amt), ethers.BigNumber.from(0));
    await dist.addEpoch(tree.root, total, 1);
    return { tree, total };
  };

  it("pays out exact shares against the merkle root", async () => {
    const a = ethers.utils.parseEther("70");
    const b = ethers.utils.parseEther("30");
    const { tree } = await makeEpoch([
      [alice, a],
      [bob, b],
    ]);
    await dist.connect(alice).claim(0, a, tree.proofFor(leafOf(alice.address, a)));
    await dist.connect(bob).claim(0, b, tree.proofFor(leafOf(bob.address, b)));
    expect(await usdc.balanceOf(alice.address)).to.equal(a);
    expect(await usdc.balanceOf(bob.address)).to.equal(b);
  });

  it("rejects double claims, wrong amounts and outsiders", async () => {
    const a = ethers.utils.parseEther("70");
    const b = ethers.utils.parseEther("30");
    const { tree } = await makeEpoch([
      [alice, a],
      [bob, b],
    ]);
    const proofA = tree.proofFor(leafOf(alice.address, a));
    await dist.connect(alice).claim(0, a, proofA);
    await expect(dist.connect(alice).claim(0, a, proofA)).to.be.revertedWith("already claimed");
    await expect(
      dist.connect(bob).claim(0, a, proofA) // bob with alice's amount/proof
    ).to.be.revertedWith("bad proof");
    await expect(
      dist.connect(carol).claim(0, b, tree.proofFor(leafOf(bob.address, b)))
    ).to.be.revertedWith("bad proof");
  });

  it("sweeps leftovers only after the delay", async () => {
    const a = ethers.utils.parseEther("70");
    const b = ethers.utils.parseEther("30");
    const { tree } = await makeEpoch([
      [alice, a],
      [bob, b],
    ]);
    await dist.connect(alice).claim(0, a, tree.proofFor(leafOf(alice.address, a)));
    await expect(dist.sweep(0)).to.be.revertedWith("too early");
    await network.provider.send("evm_increaseTime", [180 * 24 * 3600 + 1]);
    await network.provider.send("evm_mine");
    const before = await usdc.balanceOf(owner.address);
    await dist.sweep(0);
    expect((await usdc.balanceOf(owner.address)).sub(before)).to.equal(b);
    await expect(dist.sweep(0)).to.be.revertedWith("nothing left");
  });

  it("only the owner funds epochs or sweeps", async () => {
    await expect(
      dist.connect(alice).addEpoch(ethers.utils.hexZeroPad("0x01", 32), 1, 1)
    ).to.be.revertedWith("not owner");
    await expect(dist.connect(alice).sweep(0)).to.be.reverted;
  });
});
