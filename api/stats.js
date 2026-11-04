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

// A comma-separated list is allowed, and then it is also a failover: a
// transient upstream error retries on the next endpoint in turn. Order
// matters for whoever extends it — publicnode serves 45k-block getLogs but
// 403s receipts, while mainnet.base.org does the opposite.
const RPCS = (process.env.STATS_RPC || "https://base-rpc.publicnode.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const RPC_ATTEMPTS = Number(process.env.STATS_RPC_ATTEMPTS || 3);
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

const providersFor = () => RPCS.map((url) => new ethers.providers.JsonRpcProvider(url));

/**
 * Retries one chain call. A single transient failure used to abort the whole
 * scan: on 2026-11-03 the daily ledger job died on one `broker: node error`
 * 500 from publicnode, and because it runs before the commit step it also
 * threw away that day's rate snapshot — the one dataset here that cannot be
 * backfilled. Attempt `i` uses provider `i % providers.length`.
 */
export async function withRetry(fn, { attempts = 3, sleep, baseDelayMs = 500 } = {}) {
  const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(i);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await wait(baseDelayMs * 2 ** i);
    }
  }
  throw last;
}

/**
 * Scans USDC transfers to `payTo` whose value matches a known price point.
 * Returns { payments, scannedTo } and stops early at the chunk cap so a
 * long catch-up degrades into "slightly behind" rather than a timeout.
 * Every RPC call is retried, so one bad response no longer loses the run.
 */
export async function scanPayments(
  { payTo, usdc, knownAmounts, fromBlock, toBlock },
  deps = {}
) {
  const ps = deps.providers || providersFor();
  const attempts = deps.attempts ?? Math.max(RPC_ATTEMPTS, ps.length);
  const call = (fn) =>
    withRetry((i) => fn(ps[i % ps.length]), { attempts, sleep: deps.sleep });
  const head = toBlock || (await call((p) => p.getBlockNumber()));
  const paddedTo = "0x" + payTo.toLowerCase().slice(2).padStart(64, "0");
  const amounts = new Set(knownAmounts.map((a) => BigInt(a)));
  const payments = [];

  let from = fromBlock;
  let chunks = 0;
  while (from <= head && chunks < MAX_CHUNKS) {
    const to = Math.min(from + CHUNK - 1, head);
    const logs = await call((p) =>
      p.getLogs({
        fromBlock: from,
        toBlock: to,
        address: usdc,
        topics: [TRANSFER_TOPIC, null, paddedTo],
      })
    );
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
      blocks.map(async (b) => [b, (await call((p) => p.getBlock(b))).timestamp])
    )
  );
  for (const row of payments) row.ts = ts[row.block];

  // `reachedHead` is false when the loop stopped at the chunk cap with
  // blocks still unscanned — the counts are then behind, not final.
  return { payments, scannedTo: Math.min(from - 1, head), reachedHead: from > head };
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
  // The anchor is what keeps the scan bounded. Without it we start from
  // genesis, hit the chunk cap, and publish a revenue figure that is
  // simply too low — while calling it on-chain-verifiable. Say so instead.
  const empty = { lastBlock: GENESIS_BLOCK - 1, payments: [], unreadable: true };
  ledgerCache = { at: Date.now(), ledger: empty };
  return empty;
}

/**
 * Revenue split by the route that earned it, read from the transfer amounts
 * themselves: each paid route charges a different number of atomic USDC, so
 * the chain records which one was bought. A payment whose amount cannot name
 * a route lands in `unattributed` and stays there — the amounts that predate
 * the route tags are genuinely ambiguous, and filling them in with the most
 * likely route would publish a guess in a figure sold as on-chain-verifiable.
 */
const byRoute = (list, routeOf) => {
  const out = {};
  for (const p of list) {
    const key = routeOf(p.value, p.block) || "unattributed";
    out[key] ??= { payments: 0, revenue_usdc: 0 };
    out[key].payments += 1;
    out[key].revenue_usdc = Number((out[key].revenue_usdc + p.value / 1e6).toFixed(6));
  }
  return out;
};

const summarize = (list, routeOf) => ({
  payments: list.length,
  unique_payers: new Set(list.map((p) => p.from.toLowerCase())).size,
  revenue_usdc: Number((list.reduce((s, p) => s + p.value, 0) / 1e6).toFixed(6)),
  // the project's own agent wallets are counted but labeled, so
  // self-generated traffic can never read as external demand
  internal_payments: list.filter((p) => INTERNAL.has(p.from.toLowerCase())).length,
  ...(routeOf ? { by_route: byRoute(list, routeOf) } : {}),
});

export async function fetchPaymentStats({ payTo, usdc, knownAmounts, routeOf }, deps = {}) {
  if (statsCache.data && Date.now() - statsCache.refreshedAt < TTL_MS) return statsCache.data;

  const base = await (deps.ledger || ledger)();
  const scan = deps.scan || scanPayments;
  const tail = await scan({
    payTo,
    usdc,
    knownAmounts,
    fromBlock: base.lastBlock + 1,
  });
  const all = [...base.payments, ...tail.payments];

  const cutoff30d = Date.now() / 1000 - 30 * 86400;
  // The scan stops at the chunk cap rather than timing out, so a figure can
  // be behind for two different reasons: no anchor to start from, or more
  // chain than one request may read. Both are stated rather than implied.
  const behind = tail.reachedHead === false;
  const data = {
    last_30d: summarize(all.filter((p) => p.ts >= cutoff30d), routeOf),
    all_time: summarize(all, routeOf),
    since_block: GENESIS_BLOCK,
    scanned_to_block: tail.scannedTo,
    ledger_through_block: base.lastBlock,
    // Absent the anchor these counts are a partial reading, not a total.
    complete: !base.unreadable && !behind,
    ...(base.unreadable || behind
      ? {
          note: base.unreadable
            ? "the committed payments ledger could not be read, so this scan started from genesis " +
              "and stopped at the chunk cap: treat these counts as a lower bound, not a total"
            : `the scan stopped at block ${tail.scannedTo} before reaching the head: these counts are behind, not final`,
        }
      : {}),
    method:
      "on-chain USDC transfers to the revenue wallet matching known x402 price points",
    verify: `https://basescan.org/address/${payTo}#tokentxns`,
    updated: new Date().toISOString(),
  };
  statsCache.refreshedAt = Date.now();
  statsCache.data = data;
  return data;
}
