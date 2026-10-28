const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying STACH with:", deployer.address);

  // Admin wallet: initial holder of the 39M non-reserve supply.
  const holder =
    process.env.STACH_HOLDER || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";

  const STACH = await hre.ethers.getContractFactory("STACH");
  const stach = await STACH.deploy(holder);
  await stach.deployed();

  const receipt = await stach.deployTransaction.wait();
  console.log("STACH deployed at:", stach.address);
  console.log("Initial holder:", holder);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log(
    "Deploy cost (native):",
    hre.ethers.utils.formatEther(
      receipt.gasUsed.mul(receipt.effectiveGasPrice)
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
