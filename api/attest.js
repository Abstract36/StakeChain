// Tamper-evidence for the rate history.
//
// The dataset's whole value is the claim that a rate series cannot be
// reconstructed after the fact. Until now that claim rested on trusting us:
// the snapshots live in a git repository we control, and `git push --force`
// rewrites them without a trace. We were selling unforgeability we could
// ourselves forge.
//
// The fix is the oldest idea in this field. Four of the eight references in
// Bitcoin's whitepaper are digital-timestamping papers, three of them by
// Haber and Stornetta, whose 1991 scheme is exactly this: hash each record
// together with the hash of the record before it, so altering any past entry
// breaks every link after it. Bitcoin added a way to publish the head where
// nobody can rewrite it; `scripts/attest.js` can hand the head to
// OpenTimestamps for that.
//
// What this proves: that the day records form one unbroken chain, and that
// the data on disk still hashes to what was recorded when each day was
// appended.
// What it does not prove: anything about a day whose record was appended
// later than the day itself. A chain built today cannot testify about
// yesterday — only the timestamps taken from today forward can. The records
// carry `attested_at` so that distinction stays readable rather than implied.
import crypto from "crypto";

export const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

/**
 * Canonical JSON: object keys sorted at every depth, no whitespace. The hash
 * has to be reproducible by a stranger with a different JSON library, so the
 * serialization is pinned here rather than left to JSON.stringify's key
 * order (which follows insertion order, not the bytes on disk).
 */
export function canonical(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  return `{${Object.keys(v)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`)
    .join(",")}}`;
}

export const rowsHash = (rows) => sha256(canonical(rows));

/**
 * The link for one day. Fields are joined with a separator that cannot occur
 * in any of them, so no two different records can produce the same preimage.
 * Genesis uses an empty `prev`.
 */
export const linkOf = ({ prev, day, rows_hash, rows, collector }) =>
  sha256([prev || "", day, rows_hash, String(rows), collector].join("|"));

/**
 * Verifies an existing chain against the data as it stands now.
 * Returns every disagreement found rather than the first, so one run tells
 * you the whole story.
 */
export function verifyChain(attest, byDay) {
  const problems = [];
  let prev = "";
  for (const rec of attest.days) {
    const rows = byDay[rec.day];
    if (rows === undefined) {
      problems.push({ day: rec.day, kind: "data-missing" });
    } else {
      const h = rowsHash(rows);
      if (h !== rec.rows_hash) {
        problems.push({ day: rec.day, kind: "rows-changed", recorded: rec.rows_hash, actual: h });
      }
      if (rows.length !== rec.rows) {
        problems.push({ day: rec.day, kind: "row-count-changed", recorded: rec.rows, actual: rows.length });
      }
    }
    const link = linkOf({ ...rec, prev });
    if (link !== rec.link) {
      problems.push({ day: rec.day, kind: "link-broken", recorded: rec.link, actual: link });
    }
    if (rec.prev !== (prev || null)) {
      problems.push({ day: rec.day, kind: "prev-mismatch", recorded: rec.prev, actual: prev || null });
    }
    prev = rec.link;
  }
  return problems;
}

/**
 * Appends a record for every day present in the data and absent from the
 * chain. Existing records are never recomputed — an append-only log is the
 * only kind whose past means anything — so a day already recorded is
 * verified and left exactly as it was written.
 */
export function extendChain({ attest, byDay, collector, attestedAt }) {
  const base = attest || { schema: 1, algo: "sha256", days: [] };
  const problems = verifyChain(base, byDay);
  if (problems.length) return { problems, attest: base, appended: [] };

  const known = new Set(base.days.map((d) => d.day));
  const fresh = Object.keys(byDay).sort().filter((d) => !known.has(d));
  const days = [...base.days];
  let prev = days.length ? days[days.length - 1].link : "";
  const appended = [];

  for (const day of fresh) {
    const rows = byDay[day];
    const rec = {
      day,
      rows: rows.length,
      rows_hash: rowsHash(rows),
      collector,
      attested_at: attestedAt,
      prev: prev || null,
    };
    rec.link = linkOf({ ...rec, prev });
    days.push(rec);
    appended.push(day);
    prev = rec.link;
  }

  return {
    problems: [],
    appended,
    attest: {
      schema: 1,
      algo: "sha256",
      canonical: "JSON, object keys sorted at every depth, no whitespace",
      link: 'sha256(prev + "|" + day + "|" + rows_hash + "|" + rows + "|" + collector)',
      rows_hash: "sha256(canonical(the day's row array))",
      collector: "sha256 of the script that produced the rows, as it stood when the day was appended",
      days,
      head: days.length ? { day: days[days.length - 1].day, link: days[days.length - 1].link } : null,
    },
  };
}
