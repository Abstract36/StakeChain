// Provenance is the one claim this service is sold on — that Aave, Moonwell
// and our own pools are read from the protocols rather than copied from an
// aggregator snapshot. A buyer can only check that if every row says where
// its number came from, so these tests guard the field rather than the
// numbers: a row that quietly loses `source` takes the claim with it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { asPoolRows as aaveRows } from "../aave.js";
import { asPoolRows as moonwellRows } from "../moonwell.js";
import { asPoolRows as stachRows } from "../stach.js";

const SOURCES = new Set(["onchain", "morpho-api", "defillama"]);

const aaveReserve = {
  source: "onchain",
  block: 53366401,
  asset: { symbol: "USDC", decimals: 6 },
  apy: 8.49,
  tvlUsd: 175_000_000,
  url: "https://app.aave.com/",
};
const moonwellMarket = {
  source: "onchain",
  block: 53366399,
  asset: { symbol: "USDC", decimals: 6 },
  apy: 16.21,
  tvlUsd: 7_500_000,
  url: "https://moonwell.fi/",
};
const stachPool = {
  source: "onchain",
  block: 53366400,
  symbol: "flexible",
  apy: 42.0,
  tvlUsd: 1_000_000,
  url: "https://stakechain-app.vercel.app/",
};

test("on-chain readers carry source and block into yields rows", () => {
  for (const [label, row] of [
    ["aave", aaveRows([aaveReserve])[0]],
    ["moonwell", moonwellRows([moonwellMarket])[0]],
    ["stach", stachRows([stachPool])[0]],
  ]) {
    assert.equal(row.source, "onchain", `${label} lost its source`);
    assert.ok(Number.isInteger(row.block), `${label} lost its block`);
  }
});

test("a reader that reports no block says null rather than guessing", () => {
  const row = aaveRows([{ ...aaveReserve, block: undefined }])[0];
  assert.equal(row.block, null);
  assert.equal(row.source, "onchain");
});

test("source is one of the three declared values, never free text", () => {
  for (const row of [
    aaveRows([aaveReserve])[0],
    moonwellRows([moonwellMarket])[0],
    stachRows([stachPool])[0],
  ]) {
    assert.ok(SOURCES.has(row.source), `undeclared source: ${row.source}`);
  }
});

test("our own pools are labelled like everyone else's, not better", () => {
  // The temptation is to let STACH rows read as protocol data without the
  // qualifier. They are on-chain, so they say so — and nothing more.
  const row = stachRows([stachPool])[0];
  assert.equal(row.source, "onchain");
  assert.equal(row.project, "stakechain");
});
