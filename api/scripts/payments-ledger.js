// Advances data/payments.json — the committed anchor /stats scans from.
// Run daily by .github/workflows/analyst.yml, so a request only ever has
// to cover the hours since the last run instead of the whole chain.
//
//   node scripts/payments-ledger.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scanPayments, GENESIS_BLOCK } from "../stats.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = path.join(ROOT, "data", "payments.json");

const PAY_TO = process.env.PAY_TO || "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PRICE_USDC = process.env.PRICE_USDC || "0.001";
const KNOWN = [String(Math.round(parseFloat(PRICE_USDC) * 1e6)), "19000000", "99000000"];

const ledger = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE, "utf8"))
  : { schema: 1, payTo: PAY_TO, lastBlock: GENESIS_BLOCK - 1, payments: [] };

const { payments, scannedTo } = await scanPayments({
  payTo: PAY_TO,
  usdc: USDC,
  knownAmounts: KNOWN,
  fromBlock: ledger.lastBlock + 1,
});

ledger.payments.push(...payments);
ledger.lastBlock = scannedTo;
ledger.payTo = PAY_TO;
ledger.updated = new Date().toISOString();

fs.mkdirSync(path.dirname(FILE), { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(ledger, null, 2) + "\n");

console.log(
  `payments ledger: +${payments.length} new, ${ledger.payments.length} total, ` +
    `through block ${scannedTo}`
);
