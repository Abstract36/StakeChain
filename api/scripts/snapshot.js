// Daily rate snapshot: appends today's APY/TVL for every tracked market to
// data/history/<YYYY-MM>.json, committed by .github/workflows/analyst.yml.
//
// Why: current APY alone cannot answer the question that actually matters
// before committing capital — "has this rate held, or did it appear
// yesterday?". A snapshot series cannot be reconstructed after the fact, so
// the cheapest day to start collecting it is today.
//
//   [API=https://stakechain-api.vercel.app] node scripts/snapshot.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API = process.env.API || "https://stakechain-api.vercel.app";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOP_POOLS = 60;

const day = new Date().toISOString().slice(0, 10);
const month = day.slice(0, 7);

const [yields, vaults] = await Promise.all([
  fetch(`${API}/yields?limit=${TOP_POOLS}`).then((r) => r.json()),
  fetch(`${API}/vaults`).then((r) => r.json()),
]);

// One row per market: a stable id, enough labels to read it without a
// second lookup, and the two numbers that move.
const rows = [
  ...yields.pools.slice(0, TOP_POOLS).map((p) => ({
    id: p.pool,
    project: p.project,
    symbol: p.symbol,
    apy: p.apy,
    tvlUsd: p.tvlUsd,
  })),
  ...vaults.vaults.map((v) => ({
    id: `vault:${v.address.toLowerCase()}`,
    project: v.protocol,
    symbol: v.symbol,
    apy: v.apy,
    tvlUsd: v.tvlUsd,
  })),
];

const dir = path.join(ROOT, "data", "history");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${month}.json`);

const store = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, "utf8"))
  : { schema: 1, month, days: {} };
store.days[day] = rows;
fs.writeFileSync(file, JSON.stringify(store) + "\n");

// A tiny index so a reader can discover what exists without listing the dir
const indexFile = path.join(dir, "index.json");
const months = fs
  .readdirSync(dir)
  .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
  .map((f) => f.replace(".json", ""))
  .sort();
fs.writeFileSync(
  indexFile,
  JSON.stringify({ schema: 1, months, updated: day, markets: rows.length }, null, 2) + "\n"
);

console.log(`snapshot ${day}: ${rows.length} markets -> data/history/${month}.json`);
