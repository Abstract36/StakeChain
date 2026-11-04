// Builds and checks the tamper-evidence chain over data/history.
//
//   node scripts/attest.js            # verify, then append any new days
//   node scripts/attest.js --verify   # verify only, write nothing
//
// Run by .github/workflows/analyst.yml right after the snapshot. On any
// disagreement it writes nothing and exits non-zero: a chain that quietly
// repairs itself is worth less than no chain at all.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sha256, extendChain, verifyChain } from "../attest.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const DIR = path.join(ROOT, "data", "history");
const ATTEST = path.join(DIR, "attest.json");
const HEADS = path.join(DIR, "heads");
const COLLECTOR_FILE = path.join(HERE, "snapshot.js");

const verifyOnly = process.argv.includes("--verify");

if (!fs.existsSync(DIR)) {
  console.log("no data/history yet — nothing to attest");
  process.exit(0);
}

// Every day across every month file, keyed by date.
const byDay = {};
for (const f of fs.readdirSync(DIR).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort()) {
  const store = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  for (const [day, rows] of Object.entries(store.days || {})) byDay[day] = rows;
}

const existing = fs.existsSync(ATTEST) ? JSON.parse(fs.readFileSync(ATTEST, "utf8")) : null;

if (verifyOnly) {
  if (!existing) {
    console.log("no attest.json yet — nothing to verify");
    process.exit(0);
  }
  const problems = verifyChain(existing, byDay);
  for (const p of problems) console.error(`  ${p.kind}  ${p.day}  recorded=${p.recorded} actual=${p.actual}`);
  console.log(
    problems.length
      ? `FAIL: ${problems.length} disagreement(s) across ${existing.days.length} day(s)`
      : `ok: ${existing.days.length} day(s) verified, head ${existing.head?.link.slice(0, 16)}…`
  );
  process.exit(problems.length ? 1 : 0);
}

const collector = sha256(fs.readFileSync(COLLECTOR_FILE, "utf8"));
const attestedAt = new Date().toISOString();
const { problems, attest, appended } = extendChain({ attest: existing, byDay, collector, attestedAt });

if (problems.length) {
  for (const p of problems) console.error(`  ${p.kind}  ${p.day}  recorded=${p.recorded} actual=${p.actual}`);
  console.error(
    `refusing to write: ${problems.length} disagreement(s). Either the data was ` +
      `rewritten, or a month file was lost. Nothing is repaired automatically.`
  );
  process.exit(1);
}

fs.writeFileSync(ATTEST, JSON.stringify(attest, null, 1) + "\n");

// One tiny immutable file per day, holding that day's link. These are what a
// timestamping service stamps: attest.json changes daily, so a proof over it
// would stop verifying the moment the next day lands.
fs.mkdirSync(HEADS, { recursive: true });
let wroteHeads = 0;
for (const rec of attest.days) {
  const f = path.join(HEADS, `${rec.day}.txt`);
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, rec.link + "\n");
    wroteHeads++;
  }
}

console.log(
  `attest: ${attest.days.length} day(s) in chain` +
    (appended.length ? `, appended ${appended.join(", ")}` : ", nothing new") +
    `, ${wroteHeads} head file(s) written, head ${attest.head.link.slice(0, 16)}…`
);
