const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StachFaucet", function () {
  let stach, faucet, owner, user1;

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
    stach = await (await ethers.getContractFactory("STACH")).deploy(owner.address);
    faucet = await (await ethers.getContractFactory("StachFaucet")).deploy(stach.address);
    // fund the faucet with 1000 STACH
    await stach.connect(owner).transfer(faucet.address, ethers.utils.parseEther("1000"));
  });

  it("drips 100 STACH to a fresh address", async () => {
    await faucet.connect(user1).drip();
    expect(await stach.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("enforces the 24h cooldown per address", async () => {
    await faucet.connect(user1).drip();
    await expect(faucet.connect(user1).drip()).to.be.revertedWith("already dripped today");
    await network.provider.send("evm_increaseTime", [24 * 3600 + 1]);
    await network.provider.send("evm_mine");
    await faucet.connect(user1).drip();
    expect(await stach.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("200"));
  });

  it("reverts cleanly when empty", async () => {
    for (let i = 0; i < 10; i++) {
      const w = ethers.Wallet.createRandom().connect(ethers.provider);
      await owner.sendTransaction({ to: w.address, value: ethers.utils.parseEther("0.1") });
      await faucet.connect(w).drip();
    }
    const w = ethers.Wallet.createRandom().connect(ethers.provider);
    await owner.sendTransaction({ to: w.address, value: ethers.utils.parseEther("0.1") });
    await expect(faucet.connect(w).drip()).to.be.reverted;
  });
});
