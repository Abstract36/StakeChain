# Checking that the rate history was not written after the fact

Audience: anyone deciding whether to rely on `data/history/` — the daily APY
and TVL series for every market this project tracks.

The dataset is sold on one claim: **a series of rates cannot be
reconstructed later.** A current APY cannot tell you whether a rate held or
appeared yesterday, and nobody can go back and measure a day they did not
measure. That is the whole reason the series is worth collecting.

It is also a claim you had no way to check. The snapshots live in a git
repository controlled by this project, and `git push --force` rewrites them
without a trace. Until 2026-11-04 the claim rested entirely on trusting us
not to do that. This document describes what replaced the trust, and — just
as importantly — what it still does not cover.

## The scheme

Each day's rows are hashed, and each day's record is hashed together with the
hash of the record before it. Altering any past day breaks that day's hash
and every link after it. The scheme is from Haber and Stornetta, *How to
time-stamp a digital document* (1991) — reference [3] in Bitcoin's
whitepaper, which cites their work three times out of eight references.

Two definitions, both reproducible in any language:

```
canonical(x)  JSON with object keys sorted at every depth and no whitespace
rows_hash     sha256(canonical(the day's row array))
link          sha256(prev + "|" + day + "|" + rows_hash + "|" + rows + "|" + collector)
```

`prev` is the previous day's `link`, empty for the first day. `rows` is the
row count. `collector` is the sha256 of `api/scripts/snapshot.js` as it stood
when that day was appended, so a change in how the numbers were gathered is
on the record rather than invisible.

The chain is `data/history/attest.json`. Each day's link is also written
alone into `data/history/heads/<day>.txt`, which never changes once written —
those are the files a timestamping service can stamp.

Records are **append-only**. A day already in the chain is verified and left
byte-for-byte as it was written, never recomputed. `scripts/attest.js` exits
non-zero and writes nothing if the data no longer matches the chain; it never
repairs a disagreement, because a chain that silently heals is worth less
than no chain.

## Verifying it yourself

**Everything at once**, from a clone of this repository:

```bash
cd api && node scripts/attest.js --verify
```

It recomputes every day's `rows_hash` from the month files, rebuilds every
link, and reports each disagreement by name — `rows-changed`,
`row-count-changed`, `data-missing`, `link-broken`, `prev-mismatch` — rather
than stopping at the first.

**One day, without our code.** This is the check worth doing, because it
shares nothing with our implementation. Worked example on the first day in
the chain, whose record is immutable:

```python
import json, hashlib

month = json.load(open("data/history/2026-10.json"))
rows  = month["days"]["2026-10-30"]
canon = json.dumps(rows, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
print(hashlib.sha256(canon.encode()).hexdigest())
# 65a468bdfa7cae525e281f9be043648f149fd28473b52313e268fb2a93483c22

rec = json.load(open("data/history/attest.json"))["days"][0]
pre = "|".join(["", rec["day"], rec["rows_hash"], str(rec["rows"]), rec["collector"]])
print(hashlib.sha256(pre.encode()).hexdigest())
# 16111d8beb55e1e959b0165f9bd8ad0ae3b4dd55d5e75ae34e271ae3cc9d4693 == rec["link"]
```

**The dates.** A hash chain proves the days form one unbroken sequence; it
does not prove when any of them was written. For that, each new
`heads/<day>.txt` is stamped into the Bitcoin chain through
[OpenTimestamps](https://opentimestamps.org):

```bash
pipx install opentimestamps-client
ots verify data/history/heads/2026-11-05.txt.ots
```

A proof is pending for a few hours after it is made, until the calendar's
aggregate lands in a Bitcoin block; `ots upgrade` completes it, and the daily
workflow upgrades any pending proof on each run. Where no `.ots` file exists
beside a head, no timestamp was obtained for that day — read its absence as
exactly that.

**Over the API**, without cloning anything: `GET /history` returns the chain
head, the row counts and the links to all of the above.

## What this does not prove

- **Nothing about a day attested later than the day itself.** All five days
  in the chain at the time of writing — 2026-10-30, 10-31, 11-01, 11-02 and
  11-04 — were appended on 2026-11-04, before the daily workflow ran this
  step for the first time. Their hashes attest to the content as it stood on
  that date, not to what was collected at the time. Every record carries
  `attested_at`, so the distinction is readable rather than implied: from the
  first workflow run onward a record's `attested_at` falls on its own `day`,
  and these five do not.
- **Nothing about whether the numbers were right.** The chain proves the rows
  have not changed since they were recorded. Whether they described the
  market accurately depends on the upstream sources — DefiLlama and the
  vaults' own contracts — and on `snapshot.js`, whose hash is recorded but
  whose correctness is a separate question.
- **Nothing about a day that was never collected.** The series has a gap at
  2026-11-03: the snapshot was taken but discarded when a later step in the
  workflow failed, and the gap was left rather than filled with an
  evening measurement dressed up as a morning one. A missing day is visible;
  a fabricated one would not be.
- **Nothing on its own about the future.** If timestamping stops, the chain
  keeps growing but its dates revert to resting on our word.

## Recorded for a future contract: coin age

Not used anywhere in this project today, written down so it is not
rediscovered the hard way a second time.

The staking in `contracts/contracts/Token.sol` distributes rewards through a
single global accumulator (`yieldRewardsPerWeight`), incremented by an
integer division against the pool's total weight. The remainder of that
division was silently dropped, which cost up to 23.57% of the emission at a
frequent sync — see [AUDIT-2026-10.md](AUDIT-2026-10.md). It is fixed in
source by carrying the remainder, though not in the deployed instance, which
is immutable.

Peercoin solved the same problem in 2012 by not having that shape at all.
Its proof-of-stake weights each unspent output by its own **coin age**,
computed at claim time:

```cpp
// peercoin/src/kernel/chainparams.cpp
consensus.nStakeMinAge = 60 * 60 * 24 * 30;   // 30 days before a coin counts
consensus.nStakeMaxAge = 60 * 60 * 24 * 90;   // and it stops ageing at 90
// kernel: hash(...) < bnTarget * nCoinDayWeight
```

There is no shared accumulator and no shared denominator, so the truncation
class of bug cannot occur. The two bounds are also a design this project
lacks: the floor discourages churn, and the ceiling stops a large holder
compounding idle time without limit — both without requiring an explicit
lock, which is the only tool our locked pool has. Any future staking contract
here should start from that shape.
