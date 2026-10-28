const { expect } = require("chai");
const { ethers } = require("hardhat");

// Regression tests for the vulnerabilities fixed in the 2026 hardened revision.
describe("STACH fortress regression", function () {
  let stach, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("STACH");
    stach = await factory.connect(owner).deploy(owner.address);
  });

  it("transferFrom credits the recipient (was: burned recipient balance)", async () => {
    await stach.connect(owner).transfer(user1.address, ethers.utils.parseEther("100"));
    await stach.connect(user1).approve(user2.address, ethers.utils.parseEther("40"));

    await stach
      .connect(user2)
      .transferFrom(user1.address, user2.address, ethers.utils.parseEther("40"));

    expect(await stach.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("40"));
    expect(await stach.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("60"));
    expect(await stach.allowance(user1.address, user2.address)).to.equal(0);
  });

  it("transferFrom reverts without sufficient allowance", async () => {
    await stach.connect(owner).transfer(user1.address, ethers.utils.parseEther("10"));
    await expect(
      stach
        .connect(user2)
        .transferFrom(user1.address, user2.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("insufficient allowance");
  });

  it("rewards are backed: contract holds the 3M reserve at deployment", async () => {
    expect(await stach.balanceOf(stach.address)).to.equal(
      ethers.utils.parseEther("3000000")
    );
    expect(await stach.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("39000000")
    );
  });

  it("sum of balances never exceeds totalSupply after reward withdrawal", async () => {
    await stach.connect(owner).transfer(user1.address, ethers.utils.parseEther("100"));
    await stach.connect(user1).stakeInFlexible(ethers.utils.parseEther("100"));

    await network.provider.send("evm_increaseTime", [30 * 24 * 3600]);
    await network.provider.send("evm_mine");

    await stach.connect(user1).processRewards();
    const tx = await stach.connect(user1).withdrawRewards();
    await tx.wait();

    const total = await stach.totalSupply();
    const sum = (await stach.balanceOf(owner.address))
      .add(await stach.balanceOf(user1.address))
      .add(await stach.balanceOf(stach.address));
    expect(sum).to.equal(total);
  });

  it("withdrawRewards emits a Transfer event from the contract", async () => {
    await stach.connect(owner).transfer(user1.address, ethers.utils.parseEther("100"));
    await stach.connect(user1).stakeInFlexible(ethers.utils.parseEther("100"));

    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
    await stach.connect(user1).processRewards();

    await expect(stach.connect(user1).withdrawRewards()).to.emit(stach, "Transfer");
  });

  it("transfer to the zero address reverts", async () => {
    await expect(
      stach.connect(owner).transfer(ethers.constants.AddressZero, 1)
    ).to.be.revertedWith("transfer to zero address");
  });

  it("unstaking returns exactly the staked amount and keeps accounting consistent", async () => {
    await stach.connect(owner).transfer(user1.address, ethers.utils.parseEther("50"));
    await stach.connect(user1).stakeInFlexible(ethers.utils.parseEther("50"));

    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");

    await stach.connect(user1).unstakeFlexible(0, ethers.utils.parseEther("50"));
    expect(await stach.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));

    // double-unstake of the deleted deposit must fail
    await expect(
      stach.connect(user1).unstakeFlexible(0, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("amount exceeds stake");
  });
});
