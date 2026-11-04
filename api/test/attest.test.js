// The rate history is sold on one claim: a series of rates cannot be made up
// after the fact. Until these hashes existed, that claim rested on trusting
// us not to force-push over our own repository. The scheme is Haber and
// Stornetta's from 1991 — link each record to the hash of the one before it —
// and these tests are what make it worth anything: break any link in the
// chain and the break must be found and named, not quietly repaired.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, rowsHash, linkOf, extendChain, verifyChain } from "../attest.js";

const row = (id, apy) => ({ id, project: "morpho", symbol: "x", apy, tvlUsd: 1000 });
const DAYS = {
  "2026-10-30": [row("a", 5), row("b", 6)],
  "2026-10-31": [row("a", 5.5), row("b", 6.5)],
  "2026-11-01": [row("a", 5.25)],
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const build = (byDay = DAYS) =>
  extendChain({ attest: null, byDay: clone(byDay), collector: "c0", attestedAt: "2026-11-04T00:00:00.000Z" });

test("canonical form does not depend on key insertion order", () => {
  assert.equal(canonical({ b: 1, a: 2 }), canonical({ a: 2, b: 1 }));
  assert.equal(canonical([{ z: 1, a: { d: 4, c: 3 } }]), '[{"a":{"c":3,"d":4},"z":1}]');
  // a stranger reimplementing this must get the same bytes
  assert.equal(canonical({ a: [1, "x", null, true] }), '{"a":[1,"x",null,true]}');
});

test("the row hash moves when any single number moves", () => {
  const a = [row("a", 5)];
  const b = [row("a", 5.000001)];
  assert.notEqual(rowsHash(a), rowsHash(b));
  assert.equal(rowsHash(a), rowsHash(clone(a)));
});

test("a fresh chain records every day in date order, genesis first", () => {
  const { attest, appended, problems } = build();
  assert.deepEqual(problems, []);
  assert.deepEqual(appended, ["2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(attest.days[0].prev, null, "genesis has no predecessor");
  for (let i = 1; i < attest.days.length; i++) {
    assert.equal(attest.days[i].prev, attest.days[i - 1].link, `day ${i} must link to day ${i - 1}`);
  }
  assert.equal(attest.head.link, attest.days.at(-1).link);
});

test("verification passes on an untouched chain", () => {
  const { attest } = build();
  assert.deepEqual(verifyChain(attest, clone(DAYS)), []);
});

test("re-running appends nothing and never rewrites a recorded day", () => {
  const first = build().attest;
  const again = extendChain({
    attest: clone(first),
    byDay: clone(DAYS),
    collector: "DIFFERENT-collector",
    attestedAt: "2099-01-01T00:00:00.000Z",
  });
  assert.deepEqual(again.appended, []);
  assert.deepEqual(again.attest.days, first.days, "a past record is immutable, even if the collector changed");
});

test("a new day extends the chain from the existing head", () => {
  const first = build().attest;
  const byDay = { ...clone(DAYS), "2026-11-02": [row("a", 7)] };
  const next = extendChain({ attest: clone(first), byDay, collector: "c1", attestedAt: "2026-11-05T00:00:00.000Z" });
  assert.deepEqual(next.appended, ["2026-11-02"]);
  assert.equal(next.attest.days.at(-1).prev, first.head.link);
  assert.equal(next.attest.days.at(-1).collector, "c1", "each day records the collector of its own time");
});

test("changing one rate in a past day is caught and named", () => {
  const { attest } = build();
  const tampered = clone(DAYS);
  tampered["2026-10-31"][0].apy = 99;
  const problems = verifyChain(attest, tampered);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, "rows-changed");
  assert.equal(problems[0].day, "2026-10-31");
});

test("adding a row to a past day is caught twice over", () => {
  const { attest } = build();
  const tampered = clone(DAYS);
  tampered["2026-11-01"].push(row("c", 1));
  const kinds = verifyChain(attest, tampered).map((p) => p.kind).sort();
  assert.deepEqual(kinds, ["row-count-changed", "rows-changed"]);
});

test("deleting a day's data is not mistaken for a day that never existed", () => {
  const { attest } = build();
  const tampered = clone(DAYS);
  delete tampered["2026-10-31"];
  const problems = verifyChain(attest, tampered);
  assert.deepEqual(problems.map((p) => [p.day, p.kind]), [["2026-10-31", "data-missing"]]);
});

test("editing a recorded link breaks that record and the one after it", () => {
  const { attest } = build();
  const forged = clone(attest);
  forged.days[1].link = "f".repeat(64);
  const problems = verifyChain(forged, clone(DAYS));
  const kinds = problems.map((p) => `${p.day}:${p.kind}`);
  assert.ok(kinds.includes("2026-10-31:link-broken"), "the forged record itself");
  assert.ok(kinds.includes("2026-11-01:prev-mismatch"), "and the chain after it");
});

test("removing a middle record cannot be hidden", () => {
  const { attest } = build();
  const forged = clone(attest);
  forged.days.splice(1, 1);
  const problems = verifyChain(forged, clone(DAYS));
  assert.ok(problems.length > 0, "a gap must not verify");
  assert.ok(problems.some((p) => p.kind === "prev-mismatch"));
});

test("rewriting the collector of a past record is caught", () => {
  const { attest } = build();
  const forged = clone(attest);
  forged.days[0].collector = "something-else";
  assert.ok(verifyChain(forged, clone(DAYS)).some((p) => p.kind === "link-broken"));
});

test("extendChain refuses to append onto a broken chain", () => {
  const { attest } = build();
  const tampered = clone(DAYS);
  tampered["2026-10-30"][0].apy = 0;
  tampered["2026-11-02"] = [row("a", 8)];
  const out = extendChain({ attest: clone(attest), byDay: tampered, collector: "c2", attestedAt: "z" });
  assert.ok(out.problems.length > 0);
  assert.deepEqual(out.appended, [], "no new day is recorded while the past is in dispute");
  assert.equal(out.attest.days.length, 3, "and the chain is handed back untouched");
});

test("the link is a function of every field it claims to cover", () => {
  const base = { prev: "p", day: "2026-01-01", rows_hash: "h", rows: 2, collector: "c" };
  const l = linkOf(base);
  for (const k of Object.keys(base)) {
    assert.notEqual(linkOf({ ...base, [k]: "changed" }), l, `${k} must enter the hash`);
  }
});
