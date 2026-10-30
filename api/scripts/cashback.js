// Usage rewards (loop 1 + 4): every x402 payer earns STACH back, paid from
// the rewards wallet. Payments are read straight from Base logs since the
// ledger's last block, so the program is reproducible by anyone. Payers
// registered in automation/reward-chains.json with "arbitrum" receive their
// STACH bridged through the LayerZero OFT adapter instead of on Base.
//
//   REWARDS_PK=0x... node scripts/cashback.js
//
// Rates (STACH per payment) and the per-run budget cap are set below.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEDGER = path.join(ROOT, "automation", "cashback-ledger.json");
const CHAINS_FILE = path.join(ROOT, "automation", "reward-chains.json");

const RPC = "https://base-rpc.publicnode.com";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const ADAPTER = "0xa670D30A01e51E728057dD08D9332f0787Aa245c"; // LZ OFT lockbox
const PAY_TO = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const ARB_EID = 30110;

// reward per payment, keyed by the USDC amount paid (6 decimals)
const REWARDS = { 1000: "1", 19000000: "8000", 99000000: "40000" }; // STACH
const MAX_STACH_PER_RUN = ethers.utils.parseEther("50000");
// Total the programme may ever distribute: 1,000,000 STACH, 2.38% of the
// fixed supply. A per-run guard alone leaves the emission open-ended from
// the outside, which is indistinguishable from unbounded. When this is
// spent the programme stops until rates are revised and republished —
// the ledger below is the public record of how much is left.
const PROGRAMME_BUDGET = ethers.utils.parseEther("1000000");

// never reward the project's own wallets
const EXCLUDED = new Set(
  [
    PAY_TO, // treasury
    "0x297423Ed6E5f9C2177ab70eE3b80Fd81000E734F", // deployer / rewards
    ...(process.env.INTERNAL_PAYERS || "").split(","),
  ]
    .filter(Boolean)
    .map((a) => a.toLowerCase())
);

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CHUNK = 45_000;

if (!process.env.REWARDS_PK) {
  console.log("REWARDS_PK not set — skipping (nothing failed)");
  process.exit(0);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.REWARDS_PK, provider);
const stach = new ethers.Contract(
  STACH,
  [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
  ],
  wallet
);

const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
const rewardChains = fs.existsSync(CHAINS_FILE)
  ? JSON.parse(fs.readFileSync(CHAINS_FILE, "utf8"))
  : {};

// --- collect unrewarded payments since the ledger block ---------------------
const latest = await provider.getBlockNumber();
const paddedTo = "0x" + PAY_TO.toLowerCase().slice(2).padStart(64, "0");
const earned = {}; // payer -> BigNumber STACH

let from = ledger.lastBlock + 1;
while (from <= latest) {
  const to = Math.min(from + CHUNK - 1, latest);
  const logs = await provider.getLogs({
    fromBlock: from,
    toBlock: to,
    address: USDC,
    topics: [TRANSFER_TOPIC, null, paddedTo],
  });
  for (const log of logs) {
    const paid = BigInt(log.data).toString();
    const reward = REWARDS[paid];
    if (!reward) continue;
    const payer = ("0x" + log.topics[1].slice(26)).toLowerCase();
    if (EXCLUDED.has(payer)) continue;
    earned[payer] = (earned[payer] || ethers.constants.Zero).add(
      ethers.utils.parseEther(reward)
    );
  }
  from = to + 1;
}

const payers = Object.keys(earned);
const total = payers.reduce((s, p) => s.add(earned[p]), ethers.constants.Zero);
console.log(
  `scanned to block ${latest}: ${payers.length} payer(s), ` +
    `${ethers.utils.formatEther(total)} STACH to distribute`
);

const distributed = ledger.history.reduce(
  (s, h) => s.add(ethers.utils.parseEther(String(h.stach))),
  ethers.constants.Zero
);
const remaining = PROGRAMME_BUDGET.sub(distributed);
console.log(
  `programme budget: ${ethers.utils.formatEther(distributed)} of ` +
    `${ethers.utils.formatEther(PROGRAMME_BUDGET)} STACH distributed, ` +
    `${ethers.utils.formatEther(remaining)} left`
);

if (total.gt(MAX_STACH_PER_RUN)) {
  console.error("per-run cap exceeded — review REWARDS rates before running");
  process.exit(1);
}
if (total.gt(remaining)) {
  console.error(
    "programme budget exhausted — stopping rather than emitting beyond what was published"
  );
  process.exit(1);
}
const balance = await stach.balanceOf(wallet.address);
if (balance.lt(total)) {
  console.error(
    `rewards wallet holds ${ethers.utils.formatEther(balance)} STACH, needs ` +
      `${ethers.utils.formatEther(total)} — top it up and rerun`
  );
  process.exit(1);
}

// --- pay out -----------------------------------------------------------------
const OFT_ABI = [
  "function quoteSend((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),bool) view returns ((uint256 nativeFee,uint256 lzTokenFee))",
  "function send((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),(uint256,uint256),address) payable returns ((bytes32,uint64,(uint256,uint256)),(uint256,uint256))",
];
const EXTRA_OPTIONS = "0x00030100110100000000000000000000000000030d40";

for (const payer of payers) {
  const amount = earned[payer];
  const viaArbitrum = rewardChains[payer] === "arbitrum";
  let txHash;
  if (viaArbitrum) {
    const adapter = new ethers.Contract(ADAPTER, OFT_ABI, wallet);
    await (await stach.approve(ADAPTER, amount)).wait();
    const sendParam = [
      ARB_EID,
      ethers.utils.hexZeroPad(payer, 32),
      amount,
      amount,
      EXTRA_OPTIONS,
      "0x",
      "0x",
    ];
    const [nativeFee] = await adapter.quoteSend(sendParam, false);
    const tx = await adapter.send(sendParam, [nativeFee, 0], wallet.address, {
      value: nativeFee,
    });
    txHash = (await tx.wait()).transactionHash;
  } else {
    const tx = await stach.transfer(payer, amount);
    txHash = (await tx.wait()).transactionHash;
  }
  console.log(
    `${payer} <- ${ethers.utils.formatEther(amount)} STACH` +
      `${viaArbitrum ? " (bridged to Arbitrum)" : ""} tx ${txHash}`
  );
  ledger.history.push({
    date: new Date().toISOString().slice(0, 10),
    payer,
    stach: ethers.utils.formatEther(amount),
    chain: viaArbitrum ? "arbitrum" : "base",
    tx: txHash,
  });
}

ledger.lastBlock = latest;
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
console.log(`ledger updated: lastBlock=${latest}, ${payers.length} payout(s)`);
