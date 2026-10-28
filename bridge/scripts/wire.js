const hre = require("hardhat");

// Wires peers: run once per network after both sides are deployed.
//   ADAPTER=0x.. OFT_BERACHAIN=0x.. OFT_ROBINHOOD=0x.. \
//     npx hardhat run scripts/wire.js --network <base|berachain|robinhood>
const EIDS = { base: 30184, berachain: 30362, robinhood: 30416 };
const pad32 = (a) => hre.ethers.utils.hexZeroPad(a, 32);

async function main() {
  const net = hre.network.name;
  const ADAPTER = process.env.ADAPTER;
  const peersByNet = {
    berachain: process.env.OFT_BERACHAIN,
    robinhood: process.env.OFT_ROBINHOOD,
  };
  const abi = ["function setPeer(uint32 eid, bytes32 peer)", "function peers(uint32) view returns (bytes32)"];

  if (net === "base") {
    const c = await hre.ethers.getContractAt(abi, ADAPTER);
    for (const [n, addr] of Object.entries(peersByNet)) {
      if (!addr) continue;
      const tx = await c.setPeer(EIDS[n], pad32(addr));
      await tx.wait();
      console.log(`adapter peer -> ${n} (${EIDS[n]}): ${addr}`);
    }
  } else {
    const c = await hre.ethers.getContractAt(abi, peersByNet[net]);
    const tx = await c.setPeer(EIDS.base, pad32(ADAPTER));
    await tx.wait();
    console.log(`${net} OFT peer -> base: ${ADAPTER}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
