const hre = require("hardhat");

// Deploys the treasury timelock and (optionally) funds it in one go.
//
//   npx hardhat run scripts/deploy-timelock.js --network base
//
// Schedule: nothing for 6 months, then linear until month 24. Override with
// env vars if the plan changes before deployment:
//   LOCK_AMOUNT   STACH to transfer in            (default 6,300,000 = 15% of supply)
//   CLIFF_MONTHS  months before the first release (default 6)
//   TOTAL_MONTHS  months until fully vested       (default 24)
//   BENEFICIARY   address tokens release to       (default: the admin wallet)
//   FUND=false    deploy only, transfer manually later
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const ADMIN = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const MONTH = 30 * 24 * 60 * 60;

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const { parseEther, formatEther } = hre.ethers.utils;

  const amount = parseEther(process.env.LOCK_AMOUNT || "6300000");
  const cliffMonths = Number(process.env.CLIFF_MONTHS || 6);
  const totalMonths = Number(process.env.TOTAL_MONTHS || 24);
  const beneficiary = process.env.BENEFICIARY || ADMIN;

  const start = (await hre.ethers.provider.getBlock("latest")).timestamp;
  const cliff = start + cliffMonths * MONTH;
  const duration = totalMonths * MONTH;

  console.log(`network=${hre.network.name} signer=${signer.address}`);
  console.log(
    `locking ${formatEther(amount)} STACH for ${beneficiary}\n` +
      `  cliff: ${new Date(cliff * 1000).toISOString().slice(0, 10)} ` +
      `(${cliffMonths} months)\n` +
      `  fully vested: ${new Date((start + duration) * 1000).toISOString().slice(0, 10)} ` +
      `(${totalMonths} months)`
  );

  const lock = await (
    await hre.ethers.getContractFactory("TreasuryTimelock")
  ).deploy(STACH, beneficiary, start, cliff, duration);
  await lock.deployed();
  console.log("TreasuryTimelock:", lock.address);

  if (process.env.FUND !== "false") {
    const token = await hre.ethers.getContractAt(
      ["function transfer(address,uint256) returns (bool)"],
      STACH
    );
    const tx = await token.transfer(lock.address, amount);
    await tx.wait();
    console.log(`funded with ${formatEther(amount)} STACH, tx ${tx.hash}`);
  } else {
    console.log(`not funded (FUND=false): send ${formatEther(amount)} STACH to the address above`);
  }

  console.log(
    `\nverify:\n  npx hardhat verify --network ${hre.network.name} ${lock.address} ` +
      `${STACH} ${beneficiary} ${start} ${cliff} ${duration}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
