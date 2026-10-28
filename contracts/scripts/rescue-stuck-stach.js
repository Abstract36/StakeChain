const hre = require("hardhat");

// One-shot: deploys Recovery at the deployer's nonce-1 CREATE address on Base
// mainnet (0x2fc5...D1C4), where 100k STACH were mistakenly sent, and sweeps
// the balance back to the admin wallet.
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const ADMIN = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const EXPECTED = "0x2fc5f8976d3f460D78dc6AbFBd84EFBC0Da0D1C4";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const nonce = await deployer.getTransactionCount();
  const predicted = hre.ethers.utils.getContractAddress({
    from: deployer.address,
    nonce,
  });
  if (predicted.toLowerCase() !== EXPECTED.toLowerCase()) {
    throw new Error(
      `nonce drift: next CREATE is ${predicted}, expected ${EXPECTED} — aborting`
    );
  }
  const rec = await (
    await hre.ethers.getContractFactory("Recovery")
  ).deploy(STACH, ADMIN);
  await rec.deployed();
  console.log("Recovery deployed at:", rec.address);

  const stach = await hre.ethers.getContractAt("STACH", STACH);
  console.log(
    "admin STACH now:",
    hre.ethers.utils.formatEther(await stach.balanceOf(ADMIN))
  );
  console.log(
    "left at stuck address:",
    hre.ethers.utils.formatEther(await stach.balanceOf(EXPECTED))
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
