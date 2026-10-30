const hre = require("hardhat");

// Chain registry (LayerZero V2, verified via metadata.layerzero-api.com)
const CHAINS = {
  base: { eid: 30184, endpoint: "0x1a44076050125825900e736c501f859c50fE728c" },
  arbitrum: { eid: 30110, endpoint: "0x1a44076050125825900e736c501f859c50fE728c" },
  berachain: { eid: 30362, endpoint: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B" },
  robinhood: { eid: 30416, endpoint: "0x6F475642a6e85809B1c36Fa62763669b1b48DD5B" },
};
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";

async function main() {
  const net = hre.network.name;
  const { endpoint } = CHAINS[net];
  const [deployer] = await hre.ethers.getSigners();
  console.log(`network=${net} deployer=${deployer.address}`);

  if (net === "base") {
    const c = await (
      await hre.ethers.getContractFactory("StachOFTAdapter")
    ).deploy(STACH, endpoint, deployer.address);
    await c.deployed();
    console.log("StachOFTAdapter (lockbox):", c.address);
  } else {
    const c = await (
      await hre.ethers.getContractFactory("StachOFT")
    ).deploy(endpoint, deployer.address);
    await c.deployed();
    console.log("StachOFT (wrapped):", c.address);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
