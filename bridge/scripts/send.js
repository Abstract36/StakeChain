const hre = require("hardhat");

// Bridges STACH through LayerZero V2 (lock on Base / mint wrapped, and back).
//
//   From Base out:   ADAPTER=0x.. TO=arbitrum AMOUNT=10 \
//                      npx hardhat run scripts/send.js --network base
//   Back to Base:    OFT_ARBITRUM=0x.. TO=base AMOUNT=10 \
//                      npx hardhat run scripts/send.js --network arbitrum
//
// RECIPIENT defaults to the sender. The LZ fee is quoted on-chain and paid
// in the source chain's native gas. Delivery is trackable on
// https://layerzeroscan.com/tx/<hash> (usually 1-3 minutes).
const EIDS = { base: 30184, arbitrum: 30110, berachain: 30362, robinhood: 30416 };
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";

// type-3 options: 200k gas for lzReceive on the destination executor
const EXTRA_OPTIONS = "0x0003010011010000000000000000000000000000030d40";

const OFT_ABI = [
  "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) p, bool payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee) fee)",
  "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) p, (uint256 nativeFee, uint256 lzTokenFee) fee, address refundAddress) payable returns ((bytes32 guid, uint64 nonce, (uint256,uint256) fee) receipt, (uint256 amountSentLD, uint256 amountReceivedLD) oftReceipt)",
  "function balanceOf(address) view returns (uint256)",
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const net = hre.network.name;
  const dest = process.env.TO;
  if (!EIDS[dest]) throw new Error(`TO must be one of: ${Object.keys(EIDS).join(", ")}`);
  if (dest === net) throw new Error("TO must differ from --network");

  const [signer] = await hre.ethers.getSigners();
  const recipient = process.env.RECIPIENT || signer.address;
  const { parseEther, formatEther, hexZeroPad } = hre.ethers.utils;

  // dust-free amount: OFT shared decimals are 6, so amounts are truncated
  // to 1e12 granularity on the wire — truncate upfront so min == sent
  let amountLD = parseEther(process.env.AMOUNT || "10");
  amountLD = amountLD.sub(amountLD.mod(hre.ethers.BigNumber.from(10).pow(12)));

  const viaAdapter = net === "base";
  const oftAddress = viaAdapter
    ? process.env.ADAPTER
    : process.env[`OFT_${net.toUpperCase()}`];
  if (!oftAddress) throw new Error(viaAdapter ? "ADAPTER env missing" : `OFT_${net.toUpperCase()} env missing`);

  const oft = await hre.ethers.getContractAt(OFT_ABI, oftAddress);

  // the adapter locks real STACH, so it needs an allowance first
  if (viaAdapter) {
    const stach = await hre.ethers.getContractAt(ERC20_ABI, STACH);
    const allowance = await stach.allowance(signer.address, oftAddress);
    if (allowance.lt(amountLD)) {
      console.log("approving adapter for", formatEther(amountLD), "STACH…");
      await (await stach.approve(oftAddress, amountLD)).wait();
    }
  }

  const sendParam = {
    dstEid: EIDS[dest],
    to: hexZeroPad(recipient, 32),
    amountLD,
    minAmountLD: amountLD,
    extraOptions: EXTRA_OPTIONS,
    composeMsg: "0x",
    oftCmd: "0x",
  };

  const { nativeFee } = (await oft.quoteSend(sendParam, false));
  console.log(`LZ fee: ${formatEther(nativeFee)} native (${net} -> ${dest})`);

  const tx = await oft.send(sendParam, { nativeFee, lzTokenFee: 0 }, signer.address, {
    value: nativeFee,
  });
  const receipt = await tx.wait();
  console.log(`sent ${formatEther(amountLD)} STACH to ${recipient} on ${dest}`);
  console.log(`track delivery: https://layerzeroscan.com/tx/${receipt.transactionHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
