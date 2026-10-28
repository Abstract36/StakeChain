const hre = require("hardhat");

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ADMIN = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";

async function main() {
  const dist = await (
    await hre.ethers.getContractFactory("RevenueDistributor")
  ).deploy(USDC_BASE, ADMIN);
  await dist.deployed();
  console.log("RevenueDistributor:", dist.address);
  console.log("owner:", ADMIN, "· usdc:", USDC_BASE);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
