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
import { earned, alreadyPaid, owed, delivered } from "../rewards.js";
import { paidRoutes } from "../catalogue.js";
import { TIERS } from "../subscriptions.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEDGER = path.join(ROOT, "automation", "cashback-ledger.json");
const CHAINS_FILE = path.join(ROOT, "automation", "reward-chains.json");

// Two providers, two different refusals, measured 2026-11-02:
//   publicnode       eth_getLogs over 45k blocks: fine
//                    eth_getTransactionReceipt:   403, archive token required
//   mainnet.base.org eth_getLogs over 45k blocks: times out
//                    eth_getTransactionReceipt:   fine
// The scan is the part that cannot be made cheaper, so publicnode stays the
// default and the receipt is treated as optional below. Overridable either
// way, because a provider's limits are not ours to predict.
const RPC = process.env.REWARDS_RPC || process.env.BASE_RPC || "https://base-rpc.publicnode.com";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const ADAPTER = "0xa670D30A01e51E728057dD08D9332f0787Aa245c"; // LZ OFT lockbox
const PAY_TO = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const ARB_EID = 30110;

// Reward per payment, keyed by the USDC amount paid (6 decimals), and built
// from the catalogue rather than listed here: paid routes charge one atomic
// unit apart so the transfer names the route, and a table written out by hand
// would silently skip the amounts it had not heard of. The payer would earn
// nothing and nothing would report it — `if (!reward) continue` below is not
// an error path.
const PER_REQUEST_STACH = "1";
const TIER_STACH = { developer: "8000", professional: "40000" }; // STACH
const REWARDS = Object.fromEntries(
  paidRoutes({ priceUsdc: process.env.PRICE_USDC || "0.001", tiers: TIERS }).map((r) => {
    const tier = r.path.startsWith("/v1/subscribe/") ? r.path.split("/").pop() : null;
    return [r.atomic, tier ? TIER_STACH[tier] : PER_REQUEST_STACH];
  })
);
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

// Fixed, not advancing: the scan window is a performance detail, never the
// thing that decides whether a payer has been paid. See ../rewards.js.
const PROGRAMME_START_BLOCK = Number(process.env.REWARDS_START_BLOCK || 53_280_000);

const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
const rewardChains = fs.existsSync(CHAINS_FILE)
  ? JSON.parse(fs.readFileSync(CHAINS_FILE, "utf8"))
  : {};

// --- what the chain says was earned, and what it says was already sent ------
const latest = await provider.getBlockNumber();
const pad = (a) => "0x" + a.toLowerCase().slice(2).padStart(64, "0");

const scan = async (address, topics) => {
  const rows = [];
  let from = PROGRAMME_START_BLOCK;
  while (from <= latest) {
    const to = Math.min(from + CHUNK - 1, latest);
    rows.push(...(await provider.getLogs({ fromBlock: from, toBlock: to, address, topics })));
    from = to + 1;
  }
  return rows;
};

const paymentLogs = await scan(USDC, [TRANSFER_TOPIC, null, pad(PAY_TO)]);
const payoutLogs = await scan(STACH, [TRANSFER_TOPIC, pad(wallet.address), null]);

const earnedBy = earned({
  payments: paymentLogs.map((l) => ({ from: "0x" + l.topics[1].slice(26), value: BigInt(l.data).toString() })),
  rates: REWARDS,
  excluded: EXCLUDED,
});
const paidBy = alreadyPaid({
  transfers: payoutLogs.map((l) => ({ to: "0x" + l.topics[2].slice(26), value: BigInt(l.data).toString() })),
  bridged: ledger.history.filter((h) => h.chain === "arbitrum"),
  // The lockbox is not a payer: see ../rewards.js. Without this, STACH held
  // there reads as STACH delivered.
  ignore: new Set([ADAPTER]),
});
const stillOwed = owed(earnedBy, paidBy);

const payers = Object.keys(stillOwed);
const total = payers.reduce((s, p) => s.add(stillOwed[p]), ethers.constants.Zero);
console.log(
  `scanned blocks ${PROGRAMME_START_BLOCK}..${latest}: ` +
    `${Object.keys(earnedBy).length} payer(s) earned, ` +
    `${ethers.utils.formatEther(delivered(paidBy))} STACH already delivered, ` +
    `${payers.length} owed ${ethers.utils.formatEther(total)} STACH`
);
if (!payers.length) {
  console.log("nothing owed — every earned reward is already on chain");
  process.exit(0);
}

// The budget cap is measured against the chain too: a lost ledger entry used
// to understate what the programme had emitted, which is the one number it
// publicly promises to hold.
const distributed = delivered(paidBy);
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

const persist = () => fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");

/**
 * Waits for the payout to be mined, but never fails because of it. The hash
 * is known the moment the transfer is broadcast; the receipt only confirms
 * what the next run would read from the chain anyway. A provider that refuses
 * receipt lookups — which is exactly how the 2026-11-02 run died, after the
 * money had already moved — must not be able to stop the loop. A transfer
 * that reverts emits no Transfer log, so it is simply still owed next time.
 */
const confirm = async (tx) => {
  try {
    await tx.wait();
  } catch (e) {
    console.log(`  receipt unavailable (${e.code || e.message}); tx ${tx.hash} is broadcast, the chain decides`);
  }
  return tx.hash;
};

for (const payer of payers) {
  const amount = stillOwed[payer];
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
    txHash = await confirm(tx);
  } else {
    const tx = await stach.transfer(payer, amount);
    txHash = await confirm(tx);
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
  // After each payout, not once at the end: the record should never be more
  // than one transfer behind the chain.
  ledger.lastBlock = latest;
  persist();
}

persist();
console.log(`ledger updated: scanned through ${latest}, ${payers.length} payout(s)`);
