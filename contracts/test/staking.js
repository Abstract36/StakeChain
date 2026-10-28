const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STACH staking", function () {
  let stachCoin;
  let user1, user2, user3, user4, user5, user6, user7, user8, user9;
  beforeEach(async () => {
    [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] =
      await ethers.getSigners();
    all = [user1, user2, user3, user4, user5, user6, user7, user8, user9];

    let stachContract = await ethers.getContractFactory("STACH");
    stachCoin = await stachContract.connect(owner).deploy(owner.address);

    // give everyone 50 stach tokens
    for (let i = 0; i < all.length; i++) {
      await stachCoin
        .connect(owner)
        .transfer(all[i].address, ethers.utils.parseEther("50"));
    }
  });
  it("Should return the correct value for rewards duration", async function () {
    let rewardsDuration = await stachCoin.rewardsDuration();
    expect(rewardsDuration).equal(ethers.utils.parseUnits("31104000", 0));
  });

  it("should allow a user to stake his stach tokens in flexible pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));
  });

  it("should assign correct stake weight to users who stake in flexible pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));
    await stachCoin
      .connect(user1)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));
    // user1 address staking 10 tokens
    await stachCoin
      .connect(user1)
      .stakeInFlexible(ethers.utils.parseEther("20"));

    let flexibleWeightOwner = await stachCoin
      .connect(owner)
      .getFlexibleStakeWeight();
    let flexibleWeightUser1 = await stachCoin
      .connect(user1)
      .getFlexibleStakeWeight();

    expect(flexibleWeightUser1.div(flexibleWeightOwner)).equal(2);
  });

  it("should award correct amount of rewards on a flexible stake", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let rewards = await stachCoin.connect(owner).rewards(owner.address);

    expect(rewards).equal("5555555550000000000000", 0);
  });

  it("should award 1000000 stach tokens by the end of flexible staking period", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [360 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let rewards = await stachCoin.connect(owner).rewards(owner.address);
    expect(rewards).equal("999999646340000000000000", 0);
  });

  it("should award correct amount of rewards according to flexible stake weight", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));
    await stachCoin
      .connect(user1)
      .approve(stachCoin.address, ethers.utils.parseEther("20"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));
    await stachCoin
      .connect(user1)
      .stakeInFlexible(ethers.utils.parseEther("20"));

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [56 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();
    await stachCoin.connect(user1).processRewards();

    let rewardsOwner = await stachCoin.connect(owner).rewards(owner.address);
    let rewardsUser1 = await stachCoin.connect(user1).rewards(user1.address);

    // console.log(rewardsOwner);
    // console.log(rewardsUser1);
    expect(rewardsUser1 / rewardsOwner).equal(1.9999991730290845); // ~2
  });

  it("should allow a user to stake his stach tokens in locked pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 2);
  });

  it("should assign correct stake weight to users who stake in locked pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));
    await stachCoin
      .connect(user1)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 2);
    // user1 address staking 10 tokens
    await stachCoin
      .connect(user1)
      .stakeInLocked(ethers.utils.parseEther("10"), 4);

    let flexibleWeightOwner = await stachCoin
      .connect(owner)
      .getLockedStakeWeight();
    let flexibleWeightUser1 = await stachCoin
      .connect(user1)
      .getLockedStakeWeight();

    expect(flexibleWeightUser1.div(flexibleWeightOwner)).equal(2);
  });

  it("should award correct amount of rewards on a locked stake", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 2);

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let rewards = await stachCoin.connect(owner).rewards(owner.address);
    expect(rewards).equal("11111111108877780000000", 0);
  });

  it("should award 2000000 stach tokens by the end of locked staking period", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 6);

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [360 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let rewards = await stachCoin.connect(owner).rewards(owner.address);
    expect(rewards).equal("1999999292690000000000000", 0);
  });

  it("should award correct amount of rewards according to locked stake weight", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));
    await stachCoin
      .connect(user1)
      .approve(stachCoin.address, ethers.utils.parseEther("20"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 2);
    await stachCoin
      .connect(user1)
      .stakeInLocked(ethers.utils.parseEther("10"), 4);

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [56 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();
    await stachCoin.connect(user1).processRewards();

    let rewardsOwner = await stachCoin.connect(owner).rewards(owner.address);
    let rewardsUser1 = await stachCoin.connect(user1).rewards(user1.address);

    // console.log(rewardsOwner);
    // console.log(rewardsUser1);
    expect(rewardsUser1 / rewardsOwner).equal(1.9999991732870537); // ~2
  });

  it("should not allow user to stake in locked pool for more than 6 months", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await expect(
      stachCoin.connect(owner).stakeInLocked(ethers.utils.parseEther("10"), 7)
    ).to.be.revertedWith("incorrect number of months");
  });

  it("should not allow user to stake less than 1 whole Stach token in locked pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await expect(
      stachCoin
        .connect(owner)
        .stakeInLocked(ethers.utils.parseUnits("1", 17), 5)
    ).to.be.revertedWith("Cannot stake less than 1 STACH");
  });

  it("should not allow user to stake less than 1 whole Stach token in flexible pool", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await expect(
      stachCoin.connect(owner).stakeInFlexible(ethers.utils.parseUnits("1", 17))
    ).to.be.revertedWith("Cannot stake less than 1 STACH");
  });

  it("should withdraw user rewards after processing them", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // owner address staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 2);

    let initBal = await stachCoin.balanceOf(owner.address);
    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    await stachCoin.connect(owner).rewards(owner.address);

    await stachCoin.connect(owner).withdrawRewards();

    let ownerBal = await stachCoin.balanceOf(owner.address);
    expect(ownerBal.sub(initBal)).equal("11111111108877780000000", 0);
  });

  it("should allow a user to unstake flexible stake any time", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInFlexible(ethers.utils.parseEther("10"));

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [2 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let ownerBalInit = await stachCoin.balanceOf(owner.address);
    await stachCoin
      .connect(owner)
      .unstakeFlexible(0, ethers.utils.parseEther("9"));

    let ownerBalCurr = await stachCoin.balanceOf(owner.address);
    expect(ownerBalCurr.sub(ownerBalInit)).equal(ethers.utils.parseEther("9"));
  });

  it("should not allow a user to unstake locked stake before lock period ends", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 4);

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [30 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let ownerBalInit = await stachCoin.balanceOf(owner.address);
    await expect(stachCoin.connect(owner).unstakeLocked(0)).to.be.revertedWith(
      "stake is still locked"
    );
  });

  it("should allow a user to unstake locked stake after lock period ends", async () => {
    // allow contract to transfer
    await stachCoin
      .connect(owner)
      .approve(stachCoin.address, ethers.utils.parseEther("10"));

    // staking 10 tokens
    await stachCoin
      .connect(owner)
      .stakeInLocked(ethers.utils.parseEther("10"), 4);

    // fast forward 2 days
    await network.provider.send("evm_increaseTime", [4 * 30 * 24 * 3600]);

    await stachCoin.connect(owner).processRewards();

    let ownerBalInit = await stachCoin.balanceOf(owner.address);
    await stachCoin.connect(owner).unstakeLocked(0);

    let ownerBalCurr = await stachCoin.balanceOf(owner.address);
    expect(ownerBalCurr.sub(ownerBalInit)).equal(ethers.utils.parseEther("10"));
  });
});
