const { expect } = require("chai");
const { ethers } = require("hardhat");

const DAY = 24 * 60 * 60;
const MONTH = 30 * DAY;
const parse = ethers.utils.parseEther;

const at = async (ts) => {
  await ethers.provider.send("evm_setNextBlockTimestamp", [ts]);
  await ethers.provider.send("evm_mine", []);
};

describe("TreasuryTimelock", () => {
  let token, lock, admin, beneficiary, outsider, start, cliff, duration;
  const LOCKED = parse("6300000"); // 15% of the 42M supply

  beforeEach(async () => {
    [admin, beneficiary, outsider] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("STACH")).deploy(admin.address);
    await token.deployed();

    start = (await ethers.provider.getBlock("latest")).timestamp + 60;
    duration = 24 * MONTH;
    cliff = start + 6 * MONTH;

    lock = await (await ethers.getContractFactory("TreasuryTimelock")).deploy(
      token.address,
      beneficiary.address,
      start,
      cliff,
      duration
    );
    await lock.deployed();
    await token.transfer(lock.address, LOCKED);
  });

  it("holds the full amount and releases nothing before the cliff", async () => {
    expect(await lock.totalLocked()).to.equal(LOCKED);
    expect(await lock.releasable()).to.equal(0);
    await at(cliff - DAY);
    expect(await lock.releasable()).to.equal(0);
    await expect(lock.release()).to.be.revertedWith("nothing to release");
    expect(await token.balanceOf(lock.address)).to.equal(LOCKED);
  });

  it("releases the elapsed share at the cliff, to the beneficiary only", async () => {
    await at(cliff);
    // 6 of 24 months elapsed -> a quarter is vested
    const expected = LOCKED.div(4);
    expect(await lock.releasable()).to.be.closeTo(expected, parse("1000"));

    // anyone may trigger it; the destination is fixed
    await lock.connect(outsider).release();
    expect(await token.balanceOf(beneficiary.address)).to.be.closeTo(expected, parse("1000"));
    expect(await token.balanceOf(outsider.address)).to.equal(0);
  });

  it("vests linearly and never pays more than the total", async () => {
    await at(start + 12 * MONTH);
    await lock.release();
    const half = await token.balanceOf(beneficiary.address);
    expect(half).to.be.closeTo(LOCKED.div(2), parse("1000"));

    await at(start + duration);
    await lock.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(LOCKED);
    expect(await token.balanceOf(lock.address)).to.equal(0);
    expect(await lock.released()).to.equal(LOCKED);
    await expect(lock.release()).to.be.revertedWith("nothing to release");
  });

  it("has no escape hatch: the treasury cannot pull the tokens back", async () => {
    // no owner, no recovery entry point in the ABI
    const names = Object.values(lock.interface.functions).map((f) => f.name);
    expect(names).to.not.include.members(["owner", "transferOwnership", "sweep", "recover"]);
    // and a plain transfer out is impossible: the contract never approves anyone
    expect(await token.allowance(lock.address, admin.address)).to.equal(0);
  });

  it("extends the lock when the treasury tops it up later", async () => {
    await at(start + 12 * MONTH);
    await lock.release(); // half of the original amount out

    await token.transfer(lock.address, parse("1000000")); // top-up
    expect(await lock.totalLocked()).to.equal(LOCKED.add(parse("1000000")));

    // the top-up follows the same schedule rather than unlocking instantly
    const releasableNow = await lock.releasable();
    expect(releasableNow).to.be.lt(parse("1000000"));
  });

  it("rejects nonsense schedules at construction", async () => {
    const F = await ethers.getContractFactory("TreasuryTimelock");
    await expect(
      F.deploy(token.address, beneficiary.address, start, start - 1, duration)
    ).to.be.revertedWith("cliff before start");
    await expect(
      F.deploy(token.address, beneficiary.address, start, start + duration + 1, duration)
    ).to.be.revertedWith("cliff after end");
    await expect(
      F.deploy(token.address, ethers.constants.AddressZero, start, cliff, duration)
    ).to.be.revertedWith("beneficiary is zero address");
    await expect(
      F.deploy(token.address, beneficiary.address, start, cliff, 0)
    ).to.be.revertedWith("duration is zero");
  });
});
