// Ready-to-sign transaction steps for a market on the shelf.
//
// Every other yields API answers "where": this answers "and here is the
// call". The three lending protocols we cover each take deposits
// differently — ERC-4626 `deposit`, Aave `Pool.supply`, Compound-style
// `mint` — and an agent should not have to learn all three to act on an
// answer it already paid for.
//
// Allowance is read on-chain, so the approve step appears only when it is
// actually needed rather than always. Nothing here signs or sends: the
// caller holds the keys and decides.
import { ethers } from "ethers";
import { fetchBaseVaults } from "./data.js";

const RPC = () => process.env.BASE_RPC || "https://base-rpc.publicnode.com";

const erc20 = new ethers.utils.Interface([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
]);
const vault4626 = new ethers.utils.Interface([
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
]);
const aavePool = new ethers.utils.Interface([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
]);
const mToken = new ethers.utils.Interface([
  "function mint(uint256 mintAmount) returns (uint256)",
  "function redeemUnderlying(uint256 redeemAmount) returns (uint256)",
  "function redeem(uint256 redeemTokens) returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function exchangeRateStored() view returns (uint256)",
]);
const stachStaking = new ethers.utils.Interface([
  "function stakeInFlexible(uint256 amount)",
  "function stakeInLocked(uint256 amount, uint256 numOfMonths)",
]);

const step = (description, to, data) => ({ description, to, data, value: "0" });

const findMarket = (vaults, slug) => {
  const want = String(slug).toLowerCase().replace(/^vault[-:]/, "");
  return vaults.find(
    (v) =>
      v.address.toLowerCase() === want ||
      v.symbol.toLowerCase() === want ||
      `${v.protocol}-${v.asset.symbol}`.toLowerCase() === want ||
      (v.name || "").toLowerCase() === want
  );
};

/**
 * Builds the transaction sequence for depositing into or withdrawing from
 * one market. `amount` is in whole asset units ("25.5"), or "all" to exit
 * a position completely — which redeems by share rather than by amount, so
 * interest accruing between the call and the block is not stranded.
 */
export async function buildExecution({ pool, amount, from, action = "deposit" }) {
  const vaults = await fetchBaseVaults();
  const market = findMarket(vaults, pool);
  if (!market) return { error: `market not found: ${pool}`, hint: "use an id from /vaults" };
  if (!ethers.utils.isAddress(from)) return { error: "`from` must be an address" };

  const provider = new ethers.providers.JsonRpcProvider(RPC());
  const { decimals } = market.asset;
  const exitAll = String(amount).toLowerCase() === "all";
  const units = exitAll ? null : ethers.utils.parseUnits(String(amount), decimals);
  const steps = [];
  const notes = [];

  if (action === "deposit") {
    if (exitAll) return { error: "`amount: all` only applies to withdraw" };

    // STACH staking moves balances inside the token contract: no allowance
    if (market.protocol === "stakechain") {
      const locked = market.symbol === "STACH-locked";
      steps.push(
        step(
          locked
            ? `Stake ${amount} STACH locked for 6 months`
            : `Stake ${amount} STACH, withdrawable any time`,
          market.depositTo,
          locked
            ? stachStaking.encodeFunctionData("stakeInLocked", [units, 6])
            : stachStaking.encodeFunctionData("stakeInFlexible", [units])
        )
      );
      notes.push("The staking APY is a fixed emission divided among stakers, not borrower interest — see /profile.");
    } else {
      const spender = market.depositTo;
      const allowance = await new ethers.Contract(market.asset.address, erc20, provider).allowance(
        from,
        spender
      );
      if (allowance.lt(units)) {
        steps.push(
          step(
            `Approve ${amount} ${market.asset.symbol} for ${market.name}`,
            market.asset.address,
            erc20.encodeFunctionData("approve", [spender, units])
          )
        );
      } else {
        notes.push(`Existing allowance of ${ethers.utils.formatUnits(allowance, decimals)} covers this; no approve needed.`);
      }

      if (market.protocol === "aave") {
        steps.push(
          step(
            `Supply ${amount} ${market.asset.symbol} to Aave V3`,
            spender,
            aavePool.encodeFunctionData("supply", [market.asset.address, units, from, 0])
          )
        );
      } else if (market.protocol === "moonwell") {
        steps.push(
          step(
            `Mint m${market.asset.symbol} by supplying ${amount} ${market.asset.symbol}`,
            spender,
            mToken.encodeFunctionData("mint", [units])
          )
        );
      } else {
        steps.push(
          step(
            `Deposit ${amount} ${market.asset.symbol} into ${market.name}`,
            market.address,
            vault4626.encodeFunctionData("deposit", [units, from])
          )
        );
      }
    }
  } else if (action === "withdraw") {
    if (market.protocol === "stakechain") {
      return {
        error: "staking withdrawals need a deposit id",
        hint: "use the Pools screen, or call unstakeFlexible(depositId, amount) directly",
      };
    }
    if (market.protocol === "aave") {
      steps.push(
        step(
          exitAll ? `Withdraw the entire Aave position` : `Withdraw ${amount} ${market.asset.symbol} from Aave V3`,
          market.depositTo,
          aavePool.encodeFunctionData("withdraw", [
            market.asset.address,
            exitAll ? ethers.constants.MaxUint256 : units,
            from,
          ])
        )
      );
    } else if (market.protocol === "moonwell") {
      if (exitAll) {
        const shares = await new ethers.Contract(market.address, mToken, provider).balanceOf(from);
        steps.push(
          step(
            `Redeem the entire m${market.asset.symbol} balance`,
            market.address,
            mToken.encodeFunctionData("redeem", [shares])
          )
        );
      } else {
        steps.push(
          step(
            `Withdraw ${amount} ${market.asset.symbol} from Moonwell`,
            market.address,
            mToken.encodeFunctionData("redeemUnderlying", [units])
          )
        );
      }
    } else {
      if (exitAll) {
        const shares = await new ethers.Contract(market.address, erc20, provider).balanceOf(from);
        steps.push(
          step(
            `Redeem every share of ${market.name}`,
            market.address,
            vault4626.encodeFunctionData("redeem", [shares, from, from])
          )
        );
      } else {
        steps.push(
          step(
            `Withdraw ${amount} ${market.asset.symbol} from ${market.name}`,
            market.address,
            vault4626.encodeFunctionData("withdraw", [units, from, from])
          )
        );
      }
    }
    if (exitAll) {
      notes.push("Exiting by share rather than by amount, so interest earned between this call and the block is not left behind.");
    }
    if (market.risk?.utilizationPct >= 95 && market.risk?.freeLiquidityUsd != null) {
      notes.push(
        `This market is ${market.risk.utilizationPct}% lent out — about $${market.risk.freeLiquidityUsd.toLocaleString("en-US")} is withdrawable right now; a larger exit waits for repayments.`
      );
    }
  } else {
    return { error: `unknown action: ${action}`, hint: "deposit or withdraw" };
  }

  return {
    market: market.name,
    protocol: market.protocol,
    action,
    amount: exitAll ? "all" : String(amount),
    asset: market.asset,
    apy: market.apy,
    chainId: 8453,
    from,
    steps,
    notes,
    disclaimer:
      "Unsigned calldata, built from on-chain state at request time. Simulate before sending; rates and liquidity move.",
  };
}
