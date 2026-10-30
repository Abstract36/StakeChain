// Public, on-chain-verifiable usage stats: x402 payments are plain USDC
// transfers to the revenue wallet, so counts and revenue are read straight
// from Base logs — anyone can reproduce the numbers. Only transfers that
// match known price points are counted, so unrelated treasury USDC
// movements never inflate revenue.
//
// The scan is incremental: chunked eth_getLogs (public RPC caps the range
// at 50k blocks) from the block where x402 payments went live, accumulated
// in module memory and topped up on each refresh.

const RPC = process.env.STATS_RPC || "https://base-rpc.publicnode.com";
const START_BLOCK = Number(process.env.STATS_START_BLOCK || 53_100_000); // ~x402 launch, 2026-10-28
const CHUNK = 45_000;
const MAX_CHUNKS_PER_REFRESH = 40;
const TTL_MS = 10 * 60 * 1000;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const statsCache = {
  refreshedAt: 0,
  scannedTo: START_BLOCK - 1,
  payments: [], // { from, value, block, ts }
  blockTs: new Map(),
};

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}

async function blockTimestamp(blockNumber) {
  if (!statsCache.blockTs.has(blockNumber)) {
    const b = await rpc("eth_getBlockByNumber", ["0x" + blockNumber.toString(16), false]);
    statsCache.blockTs.set(blockNumber, parseInt(b.timestamp, 16));
  }
  return statsCache.blockTs.get(blockNumber);
}

async function refresh({ payTo, usdc, knownAmounts }) {
  const latest = parseInt(await rpc("eth_blockNumber", []), 16);
  const paddedTo = "0x" + payTo.toLowerCase().slice(2).padStart(64, "0");
  const amounts = new Set(knownAmounts.map((a) => BigInt(a)));

  let from = statsCache.scannedTo + 1;
  let chunks = 0;
  while (from <= latest && chunks < MAX_CHUNKS_PER_REFRESH) {
    const to = Math.min(from + CHUNK - 1, latest);
    const logs = await rpc("eth_getLogs", [
      {
        fromBlock: "0x" + from.toString(16),
        toBlock: "0x" + to.toString(16),
        address: usdc,
        topics: [TRANSFER_TOPIC, null, paddedTo],
      },
    ]);
    for (const log of logs) {
      const value = BigInt(log.data);
      if (!amounts.has(value)) continue;
      const block = parseInt(log.blockNumber, 16);
      statsCache.payments.push({
        from: "0x" + log.topics[1].slice(26),
        value: Number(value),
        block,
        ts: await blockTimestamp(block),
      });
    }
    statsCache.scannedTo = to;
    from = to + 1;
    chunks++;
  }
  statsCache.refreshedAt = Date.now();
}

// The project's own agent wallets are counted but labeled, so self-generated
// traffic can never masquerade as external demand.
const INTERNAL = new Set(
  (process.env.INTERNAL_PAYERS || "").toLowerCase().split(",").filter(Boolean)
);

const summarize = (list) => ({
  payments: list.length,
  unique_payers: new Set(list.map((p) => p.from)).size,
  revenue_usdc: Number((list.reduce((s, p) => s + p.value, 0) / 1e6).toFixed(6)),
  internal_payments: list.filter((p) => INTERNAL.has(p.from)).length,
});

export async function fetchPaymentStats({ payTo, usdc, knownAmounts }) {
  if (Date.now() - statsCache.refreshedAt > TTL_MS) {
    await refresh({ payTo, usdc, knownAmounts });
  }
  const cutoff30d = Date.now() / 1000 - 30 * 86400;
  return {
    last_30d: summarize(statsCache.payments.filter((p) => p.ts >= cutoff30d)),
    all_time: summarize(statsCache.payments),
    since_block: START_BLOCK,
    scanned_to_block: statsCache.scannedTo,
    method:
      "on-chain USDC transfers to the revenue wallet matching known x402 price points",
    verify: `https://basescan.org/address/${payTo}#tokentxns`,
    updated: new Date(statsCache.refreshedAt).toISOString(),
  };
}
