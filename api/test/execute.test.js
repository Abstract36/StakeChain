// Tests for the one module that emits bytes somebody signs and broadcasts.
//
// Everything else here returns numbers a reader can sanity-check. /execute
// returns calldata: if the selector is wrong, or an argument is in the wrong
// slot, or `onBehalfOf` names the wrong address, the agent finds out when
// the money has already moved. It had no tests at all, which is why these
// assert the encoded bytes rather than the prose around them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { buildExecution } from "../execute.js";

const FROM = "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Read-only stub: every eth_call answers with one uint256.
const providerReturning = (value) => ({
  _isProvider: true,
  getNetwork: async () => ({ chainId: 8453, name: "base" }),
  resolveName: async (n) => n,
  call: async () => ethers.utils.defaultAbiCoder.encode(["uint256"], [value]),
});
const NO_ALLOWANCE = providerReturning(0);

const asset = { address: USDC, symbol: "USDC", decimals: 6 };
const shelf = [
  {
    address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    depositTo: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    symbol: "SPARKUSDC", name: "Spark USDC Vault", protocol: "morpho",
    apy: 8.13, tvlUsd: 450_000_000, asset, risk: {},
  },
  {
    address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
    depositTo: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    symbol: "aBasUSDC", name: "Aave V3 USDC", protocol: "aave",
    apy: 8.49, tvlUsd: 175_000_000, asset, risk: {},
  },
  {
    address: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    depositTo: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    symbol: "mUSDC", name: "Moonwell USDC", protocol: "moonwell",
    apy: 16.21, tvlUsd: 7_500_000, asset,
    risk: { utilizationPct: 99.9, freeLiquidityUsd: 1 },
  },
  {
    address: "0x82c5f9901CD9AEE3177053482b79aEA235507166",
    depositTo: "0x82c5f9901CD9AEE3177053482b79aEA235507166",
    symbol: "STACH-flexible", name: "STACH flexible staking", protocol: "stakechain",
    apy: 42, tvlUsd: 1_000_000,
    asset: { address: "0x82c5f9901CD9AEE3177053482b79aEA235507166", symbol: "STACH", decimals: 18 },
    risk: {},
  },
];

const build = (args, provider = NO_ALLOWANCE) =>
  buildExecution(args, { vaults: shelf, provider });

const selector = (step) => step.data.slice(0, 10);
const argsOf = (types, step) =>
  ethers.utils.defaultAbiCoder.decode(types, "0x" + step.data.slice(10));

test("morpho deposit: approve the vault, then ERC-4626 deposit to the caller", async () => {
  const r = await build({ pool: "sparkusdc", amount: "25.5", from: FROM });
  assert.equal(r.steps.length, 2);

  assert.equal(selector(r.steps[0]), ethers.utils.id("approve(address,uint256)").slice(0, 10));
  assert.equal(r.steps[0].to, USDC, "approve must go to the token, not the vault");
  const [spender, allowed] = argsOf(["address", "uint256"], r.steps[0]);
  assert.equal(spender, shelf[0].depositTo);
  assert.equal(allowed.toString(), "25500000", "6 decimals, not 18");

  assert.equal(
    selector(r.steps[1]),
    ethers.utils.id("deposit(uint256,address)").slice(0, 10)
  );
  const [assets, receiver] = argsOf(["uint256", "address"], r.steps[1]);
  assert.equal(assets.toString(), "25500000");
  assert.equal(receiver, FROM, "shares must land with the caller, not the vault");
});

test("aave deposit: supply names the asset and credits onBehalfOf = from", async () => {
  const r = await build({ pool: "aave-usdc", amount: "100", from: FROM });
  const supply = r.steps[1];
  assert.equal(
    selector(supply),
    ethers.utils.id("supply(address,uint256,address,uint16)").slice(0, 10)
  );
  const [a, amt, onBehalfOf, ref] = argsOf(
    ["address", "uint256", "address", "uint16"],
    supply
  );
  assert.equal(a, USDC);
  assert.equal(amt.toString(), "100000000");
  assert.equal(onBehalfOf, FROM, "the position must be credited to the caller");
  assert.equal(ref, 0);
  assert.equal(supply.to, shelf[1].depositTo, "supply goes to the Pool, not the aToken");
});

test("moonwell deposit: mint on the mToken, which is also the approval target", async () => {
  const r = await build({ pool: "mUSDC", amount: "10", from: FROM });
  const [spender] = argsOf(["address", "uint256"], r.steps[0]);
  assert.equal(spender, shelf[2].depositTo);
  assert.equal(selector(r.steps[1]), ethers.utils.id("mint(uint256)").slice(0, 10));
  assert.equal(argsOf(["uint256"], r.steps[1])[0].toString(), "10000000");
});

test("stach staking needs no approve: the token moves its own balances", async () => {
  const r = await build({ pool: "STACH-flexible", amount: "1000", from: FROM });
  assert.equal(r.steps.length, 1, "an approve step here would be a wasted transaction");
  assert.equal(
    selector(r.steps[0]),
    ethers.utils.id("stakeInFlexible(uint256)").slice(0, 10)
  );
  assert.equal(argsOf(["uint256"], r.steps[0])[0].toString(), ethers.utils.parseEther("1000").toString());
});

test("an existing allowance drops the approve step and says so", async () => {
  const r = await build(
    { pool: "sparkusdc", amount: "5", from: FROM },
    providerReturning(ethers.utils.parseUnits("1000", 6))
  );
  assert.equal(r.steps.length, 1);
  assert.equal(selector(r.steps[0]), ethers.utils.id("deposit(uint256,address)").slice(0, 10));
  assert.ok(r.notes.some((n) => /no approve needed/.test(n)));
});

test("withdraw all exits by share, not by amount", async () => {
  const shares = ethers.utils.parseUnits("42", 18);
  const r = await build(
    { pool: "sparkusdc", amount: "all", from: FROM, action: "withdraw" },
    providerReturning(shares)
  );
  assert.equal(selector(r.steps[0]), ethers.utils.id("redeem(uint256,address,address)").slice(0, 10));
  const [sh, receiver, owner] = argsOf(["uint256", "address", "address"], r.steps[0]);
  assert.equal(sh.toString(), shares.toString());
  assert.equal(receiver, FROM);
  assert.equal(owner, FROM);
  assert.ok(r.notes.some((n) => /by share rather than by amount/.test(n)));
});

test("aave withdraw all uses MaxUint256, the protocol's own sentinel", async () => {
  const r = await build({ pool: "aave-usdc", amount: "all", from: FROM, action: "withdraw" });
  const [a, amt, to] = argsOf(["address", "uint256", "address"], r.steps[0]);
  assert.equal(a, USDC);
  assert.equal(amt.toString(), ethers.constants.MaxUint256.toString());
  assert.equal(to, FROM);
});

test("moonwell partial withdraw redeems underlying, not shares", async () => {
  const r = await build({ pool: "mUSDC", amount: "7", from: FROM, action: "withdraw" });
  assert.equal(selector(r.steps[0]), ethers.utils.id("redeemUnderlying(uint256)").slice(0, 10));
  assert.equal(argsOf(["uint256"], r.steps[0])[0].toString(), "7000000");
});

test("a market lent out to 99.9% warns before the exit is signed", async () => {
  const r = await build({ pool: "mUSDC", amount: "7", from: FROM, action: "withdraw" });
  assert.ok(
    r.notes.some((n) => /99.9% lent out/.test(n)),
    "the one note that stops an agent signing an exit it cannot complete"
  );
});

test("refuses what it cannot build rather than guessing", async () => {
  const cases = [
    [{ pool: "nope", amount: "1", from: FROM }, /market not found/],
    [{ pool: "sparkusdc", amount: "1", from: "not-an-address" }, /must be an address/],
    [{ pool: "sparkusdc", amount: "all", from: FROM }, /only applies to withdraw/],
    [{ pool: "sparkusdc", amount: "1", from: FROM, action: "yolo" }, /unknown action/],
    [
      { pool: "STACH-flexible", amount: "1", from: FROM, action: "withdraw" },
      /need a deposit id/,
    ],
  ];
  for (const [args, pattern] of cases) {
    const r = await build(args);
    assert.ok(r.error, `expected a refusal for ${JSON.stringify(args)}`);
    assert.match(r.error, pattern);
    assert.equal(r.steps, undefined, "a refusal must not ship calldata alongside it");
  }
});

test("every step is a complete, sendable transaction", async () => {
  const r = await build({ pool: "aave-usdc", amount: "1", from: FROM });
  assert.equal(r.chainId, 8453);
  for (const s of r.steps) {
    assert.ok(ethers.utils.isAddress(s.to), "step.to must be an address");
    assert.match(s.data, /^0x[0-9a-f]{8,}$/i, "step.data must be calldata");
    assert.ok(s.description, "a step an agent cannot describe is one it should not sign");
  }
});
