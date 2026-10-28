const hre = require("hardhat");

// Testnet-only: deploys the STACH faucet pointing at the existing token.
async function main() {
  const stach = process.env.STACH_ADDRESS || "0x82c5f9901CD9AEE3177053482b79aEA235507166";
  const Faucet = await hre.ethers.getContractFactory("StachFaucet");
  const faucet = await Faucet.deploy(stach);
  await faucet.deployed();
  console.log("StachFaucet deployed at:", faucet.address);
  console.log("Fund it by transferring STACH to that address.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
