// Resident analyst (loop 2): once a day it PAYS the project's own x402
// endpoint like any external agent would, then writes a dated yields digest
// into reports/. Run by .github/workflows/analyst.yml; its wallet is listed
// in INTERNAL_PAYERS so /stats labels this traffic as the project's own.
//
//   ANALYST_PK=0x... [API=https://stakechain-api.vercel.app] node scripts/analyst.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { payFetch, settlementOf } from "../x402-client.js";

const API = process.env.API || "https://stakechain-api.vercel.app";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

if (!process.env.ANALYST_PK) {
  console.log("ANALYST_PK not set — skipping (nothing failed)");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);

const free = await (await fetch(`${API}/yields`)).json();
const top = free.pools.slice(0, 10);

const picks = [];
for (const asset of ["USDC", "ETH"]) {
  const res = await payFetch(`${API}/v1/best?asset=${asset}`, {
    pk: process.env.ANALYST_PK,
  });
  if (res.status !== 200) {
    console.error(`paid call for ${asset} failed: ${res.status}`);
    continue;
  }
  const body = await res.json();
  picks.push({ asset, best: body.best, settle: settlementOf(res) });
}

const fmtUsd = (n) => "$" + Math.round(n).toLocaleString("en-US");
const lines = [
  `# Base yields digest — ${today}`,
  "",
  "Written by the resident analyst agent. The best-pick data below was",
  "bought from the project's own x402 API with a real on-chain USDC",
  "payment, like any external agent would buy it.",
  "",
  "## Best picks (paid `/v1/best` calls)",
  "",
];
for (const p of picks) {
  lines.push(
    `- **${p.asset}**: ${p.best.project} — ${p.best.apy}% APY, TVL ${fmtUsd(p.best.tvlUsd)}` +
      (p.settle ? ` · [payment tx](https://basescan.org/tx/${p.settle.transaction})` : "")
  );
}
lines.push(
  "",
  "## Top Base pools by TVL (free `/yields`)",
  "",
  "| Project | Symbol | APY | TVL |",
  "|---|---|---|---|",
  ...top.map((p) => `| ${p.project} | ${p.symbol} | ${p.apy}% | ${fmtUsd(p.tvlUsd)} |`),
  "",
  "*Market data, not financial advice. Source: StakeChain yields API (DefiLlama + Morpho).*",
  ""
);

const dailyDir = path.join(ROOT, "reports", "daily");
fs.mkdirSync(dailyDir, { recursive: true });
fs.writeFileSync(path.join(dailyDir, `${today}.md`), lines.join("\n"));
fs.writeFileSync(
  path.join(ROOT, "reports", "README.md"),
  `# Analyst reports\n\nDaily Base-yields digests written by the resident agent, which pays\nthe project's own x402 API for its data. Latest: [${today}](daily/${today}.md)\n`
);
console.log(`digest written: reports/daily/${today}.md (${picks.length} paid calls)`);
