// A source we cannot read drops out of the shelf, and until now that looked
// exactly like a source with nothing to show. The distinction matters more
// here than almost anywhere: DefiLlama carries no Moonwell USDC market at
// all, so an RPC timeout does not make the answer slightly stale — it
// removes a market and leaves the wrong one looking like the best rate on
// Base. These tests hold the line the xhagents thread put plainly: a
// refused read must never be reported as a zero.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchBaseVaults, vaultsCache } from "../data.js";

const morphoVault = {
  address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
  symbol: "SPARKUSDC",
  name: "Spark USDC Vault",
  creationTimestamp: 1700000000,
  asset: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6 },
  state: {
    netApy: 0.0813, netApyExcludingRewards: 0.08, totalAssetsUsd: 450_000_000, fee: 0.1,
    allocation: [{ supplyAssetsUsd: 450_000_000, market: { lltv: "860000000000000000", collateralAsset: { symbol: "cbBTC" } } }],
  },
};
const onchainRow = (protocol, symbol) => ({
  source: "onchain", block: 53366400,
  address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
  depositTo: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  symbol, name: `${protocol} USDC`, protocol,
  apy: 8.49, tvlUsd: 175_000_000,
  asset: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6 },
  url: "https://example.invalid/", risk: {},
});

const reset = () => Object.assign(vaultsCache, { at: 0, vaults: [], sources: null });
const down = () => { throw new Error("RPC timeout"); };

test("a reader that throws is named, not silently dropped", async () => {
  reset();
  await fetchBaseVaults({
    morpho: async () => [morphoVault],
    aave: async () => [onchainRow("aave", "aBasUSDC")],
    moonwell: down,
    stach: async () => [],
  });
  assert.deepEqual(vaultsCache.sources, {
    morpho: "ok", aave: "ok", moonwell: "unreachable", stakechain: "ok",
  });
});

test("every reader failing still serves, and says so for each one", async () => {
  reset();
  const vaults = await fetchBaseVaults({
    morpho: async () => [morphoVault],
    aave: down, moonwell: down, stach: down,
  });
  assert.equal(vaults.length, 1, "the Morpho shelf still serves");
  assert.deepEqual(vaultsCache.sources, {
    morpho: "ok", aave: "unreachable", moonwell: "unreachable", stakechain: "unreachable",
  });
});

test("an empty reader is 'ok', not 'unreachable' — the two must not collapse", async () => {
  reset();
  await fetchBaseVaults({
    morpho: async () => [morphoVault],
    aave: async () => [],      // read fine, nothing qualified
    moonwell: down,            // could not read at all
    stach: async () => [],
  });
  // This is the whole point: "no qualifying markets" and "could not reach
  // the protocol" produce the same empty list and must not produce the
  // same status.
  assert.equal(vaultsCache.sources.aave, "ok");
  assert.equal(vaultsCache.sources.moonwell, "unreachable");
});

test("nothing is marked unreachable when everything answers", async () => {
  reset();
  await fetchBaseVaults({
    morpho: async () => [morphoVault],
    aave: async () => [onchainRow("aave", "aBasUSDC")],
    moonwell: async () => [onchainRow("moonwell", "mUSDC")],
    stach: async () => [],
  });
  assert.ok(
    Object.values(vaultsCache.sources).every((v) => v === "ok"),
    `a healthy response must not cry wolf: ${JSON.stringify(vaultsCache.sources)}`
  );
});
