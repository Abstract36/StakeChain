// Public, on-chain-verifiable usage stats: x402 payments are plain USDC
// transfers to the revenue wallet, so counts and revenue are read straight
// from Base logs. Only transfers matching known price points are counted,
// so unrelated treasury USDC movements never inflate revenue.
//
// The scan is anchored to a ledger committed in the public repo
// (data/payments.json, refreshed daily by the workflow): a request scans
// only from the ledger's last block to the head, a bounded window, instead
// of replaying the chain since launch on every cold start. Without that
// anchor the work grew with the chain and would eventually hit the chunk
// cap and silently under-report.
import { ethers } from "ethers";

const RPC = process.env.STATS_RPC || "https://base-rpc.publicnode.com";
const LEDGER_URL =
  process.env.PAYMENTS_LEDGER ||
  "https://raw.githubusercontent.com/Abstract36/StakeChain/main/data/payments.json";
export const GENESIS_BLOCK = Number(process.env.STATS_START_BLOCK || 53_100_000);
const CHUNK = 45_000;
const MAX_CHUNKS = 40;
const TTL_MS = 10 * 60 * 1000;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const statsCache = { refreshedAt: 0, data: null };
let ledgerCache = { at: 0, ledger: null };

const INTERNAL = new Set(
  (process.env.INTERNAL_PAYERS || "").toLowerCase().split(",").filter(Boolean)
);

async function provider() {
  return new ethers.providers.JsonRpcProvider(RPC);
}

/**
 * Scans USDC transfers to `payTo` whose value matches a known price point.
 * Returns { payments, scannedTo } and stops early at the chunk cap so a
 * long catch-up degrades into "slightly behind" rather than a timeout.
 */
export async function scanPayments({ payTo, usdc, knownAmounts, fromBlock, toBlock }) {
  const p = await provider();
  const head = toBlock || (await p.getBlockNumber());
  const paddedTo = "0x" + payTo.toLowerCase().slice(2).padStart(64, "0");
  const amounts = new Set(knownAmounts.map((a) => BigInt(a)));
  const payments = [];

  let from = fromBlock;
  let chunks = 0;
  while (from <= head && chunks < MAX_CHUNKS) {
    const to = Math.min(from + CHUNK - 1, head);
    const logs = await p.getLogs({
      fromBlock: from,
      toBlock: to,
      address: usdc,
      topics: [TRANSFER_TOPIC, null, paddedTo],
    });
    for (const log of logs) {
      const value = BigInt(log.data);
      if (!amounts.has(value)) continue;
      // ethers decodes blockNumber; a raw eth_getLogs would give hex
      const block =
        typeof log.blockNumber === "number" ? log.blockNumber : parseInt(log.blockNumber, 16);
      payments.push({
        from: "0x" + log.topics[1].slice(26),
        value: Number(value),
        block,
      });
    }
    from = to + 1;
    chunks++;
  }
  // timestamps only for the new rows, one call per distinct block
  const blocks = [...new Set(payments.map((x) => x.block))];
  const ts = Object.fromEntries(
    await Promise.all(
      blocks.map(async (b) => [b, (await p.getBlock(b)).timestamp])
    )
  );
  for (const row of payments) row.ts = ts[row.block];

  return { payments, scannedTo: Math.min(from - 1, head) };
}

async function ledger() {
  if (ledgerCache.ledger && Date.now() - ledgerCache.at < TTL_MS) return ledgerCache.ledger;
  try {
    const res = await fetch(LEDGER_URL);
    if (res.ok) {
      const l = await res.json();
      ledgerCache = { at: Date.now(), ledger: l };
      return l;
    }
  } catch {
    /* fall through to a cold ledger */
  }
  const empty = { lastBlock: GENESIS_BLOCK - 1, payments: [] };
  ledgerCache = { at: Date.now(), ledger: empty };
  return empty;
}

const summarize = (list) => ({
  payments: list.length,
  unique_payers: new Set(list.map((p) => p.from.toLowerCase())).size,
  revenue_usdc: Number((list.reduce((s, p) => s + p.value, 0) / 1e6).toFixed(6)),
  // the project's own agent wallets are counted but labeled, so
  // self-generated traffic can never read as external demand
  internal_payments: list.filter((p) => INTERNAL.has(p.from.toLowerCase())).length,
});

export async function fetchPaymentStats({ payTo, usdc, knownAmounts }) {
  if (statsCache.data && Date.now() - statsCache.refreshedAt < TTL_MS) return statsCache.data;

  const base = await ledger();
  const tail = await scanPayments({
    payTo,
    usdc,
    knownAmounts,
    fromBlock: base.lastBlock + 1,
  });
  const all = [...base.payments, ...tail.payments];

  const cutoff30d = Date.now() / 1000 - 30 * 86400;
  const data = {
    last_30d: summarize(all.filter((p) => p.ts >= cutoff30d)),
    all_time: summarize(all),
    since_block: GENESIS_BLOCK,
    scanned_to_block: tail.scannedTo,
    ledger_through_block: base.lastBlock,
    method:
      "on-chain USDC transfers to the revenue wallet matching known x402 price points",
    verify: `https://basescan.org/address/${payTo}#tokentxns`,
    updated: new Date().toISOString(),
  };
  statsCache.refreshedAt = Date.now();
  statsCache.data = data;
  return data;
}
