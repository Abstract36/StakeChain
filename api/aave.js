// Aave V3 on Base. Unlike ERC-4626 vaults, every reserve is supplied
// through the single Pool contract (`supply`/`withdraw`) and the position
// is held as an aToken, so entries carry both addresses explicitly.
//
// Rates and TVL are read from the protocol itself rather than from the
// DefiLlama snapshot: Llama currently reports the Base USDC reserve — the
// largest one, ~$170M supplied — with a TVL of 0, which would hide the
// best opportunity on the shelf. Reading the Pool is also one less party
// to trust for numbers users act on.
import { ethers } from "ethers";

export const AAVE_POOL = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
const AAVE_ORACLE = "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156";
const SECONDS_PER_YEAR = 31_536_000;
const RAY = 1e27;

// Curated reserves: the liquid, non-exotic ones users actually supply.
const RESERVES = [
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "EURC", address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", decimals: 6 },
  { symbol: "GHO", address: "0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee", decimals: 18 },
  { symbol: "cbETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18 },
  { symbol: "wstETH", address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18 },
];

const POOL_ABI = [
  "function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))",
];
const ORACLE_ABI = ["function getAssetsPrices(address[] assets) view returns (uint256[])"];
const ATOKEN_ABI = ["function totalSupply() view returns (uint256)"];
// bits 64-79 of the reserve configuration hold the reserve factor in bps:
// the share of borrower interest the protocol keeps, Aave's analogue of a
// vault curator's cut
const reserveFactorPct = (configuration) =>
  Number(ethers.BigNumber.from(configuration).shr(64).and(0xffff).toNumber() / 100);

// Aave's liquidity rate is a per-second ray APR; compound it like the app does
const rateToApy = (ray) => {
  const perSecond = Number(ray.toString()) / RAY / SECONDS_PER_YEAR;
  return (Math.pow(1 + perSecond, SECONDS_PER_YEAR) - 1) * 100;
};

export async function fetchAaveReserves({ rpc, minTvlUsd = 500_000, minApy = 0.05 } = {}) {
  const provider = new ethers.providers.JsonRpcProvider(
    rpc || process.env.BASE_RPC || "https://base-rpc.publicnode.com"
  );
  const pool = new ethers.Contract(AAVE_POOL, POOL_ABI, provider);
  const oracle = new ethers.Contract(AAVE_ORACLE, ORACLE_ABI, provider);

  const [reserveData, prices] = await Promise.all([
    Promise.all(RESERVES.map((r) => pool.getReserveData(r.address))),
    oracle.getAssetsPrices(RESERVES.map((r) => r.address)),
  ]);

  const [supplies, debts] = await Promise.all([
    Promise.all(
      reserveData.map((d) =>
        new ethers.Contract(d.aTokenAddress, ATOKEN_ABI, provider).totalSupply()
      )
    ),
    Promise.all(
      reserveData.map((d) =>
        new ethers.Contract(d.variableDebtTokenAddress, ATOKEN_ABI, provider).totalSupply()
      )
    ),
  ]);

  return RESERVES.map((r, i) => {
    const apy = Number(rateToApy(reserveData[i].currentLiquidityRate).toFixed(2));
    // oracle prices carry 8 decimals, aToken supply the asset's own
    const supplied = Number(ethers.utils.formatUnits(supplies[i], r.decimals));
    const tvlUsd = Math.round(supplied * (Number(prices[i].toString()) / 1e8));
    if (tvlUsd < minTvlUsd || apy < minApy) return null;
    return {
      // the position token: where a user's balance is read from
      address: reserveData[i].aTokenAddress,
      // where the deposit goes (approve + supply target)
      depositTo: AAVE_POOL,
      symbol: `a${r.symbol}`,
      name: `Aave V3 ${r.symbol}`,
      asset: { address: r.address, symbol: r.symbol, decimals: r.decimals },
      apy,
      tvlUsd,
      protocol: "aave",
      url: "https://app.aave.com/?marketName=proto_base_v3",
      // The same facts a vault's `risk` block carries, in the shape a
      // shared pool has them: the protocol's cut instead of a curator's,
      // and utilisation instead of allocation — at 98% borrowed a rate is
      // high because the exit is narrow, which a depositor should see.
      risk: {
        curatorFeePct: reserveFactorPct(reserveData[i].configuration),
        curatorLabel: "protocol reserve factor",
        ageDays: null,
        apyFromInterest: apy,
        apyFromIncentives: 0,
        // aToken supply already counts what is lent out, so utilisation is
        // debt over that total — not debt over the idle remainder
        utilizationPct: supplied
          ? Number(
              Math.min(
                (Number(ethers.utils.formatUnits(debts[i], r.decimals)) / supplied) * 100,
                100
              ).toFixed(1)
            )
          : null,
        freeLiquidityUsd: Math.round(
          Math.max(
            supplied - Number(ethers.utils.formatUnits(debts[i], r.decimals)),
            0
          ) * (Number(prices[i].toString()) / 1e8)
        ),
        marketCount: null,
        topAllocationPct: null,
        topCollateral: null,
      },
    };
  }).filter(Boolean);
}

const STABLES = new Set(["USDC", "EURC", "GHO"]);

/**
 * The same reserves shaped as yields-table rows, so the public table can
 * show Aave with numbers read from the protocol instead of the broken ones
 * in the DefiLlama snapshot.
 */
export function asPoolRows(reserves) {
  return reserves.map((r) => ({
    project: "aave-v3",
    symbol: r.asset.symbol.toUpperCase(),
    category: "Lending",
    apy: r.apy,
    apyBase: r.apy,
    apyReward: null,
    tvlUsd: r.tvlUsd,
    stablecoin: STABLES.has(r.asset.symbol.toUpperCase()),
    ilRisk: "no",
    pool: `aave-v3-base-${r.asset.symbol.toLowerCase()}`,
    url: r.url,
    llamaUrl: "https://defillama.com/protocol/aave-v3",
  }));
}
