// STACH's own staking pools, read exactly the way Aave and Moonwell are.
//
// Putting our own product through our own lens is the point: the profile
// that comes out is unflattering, and it should be. The APY here is a
// fixed emission from a finite reserve divided among whoever has staked —
// not interest paid by a borrower — so it falls as the pool fills and
// stops entirely when the reserve runs out. A yields API that flattered
// its own token would not be worth asking about anyone else's.
import { ethers } from "ethers";

const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const WEIGHT = 1e6;
const FLEX_EMISSION = 1_000_000; // STACH over the reward period
const LOCKED_EMISSION = 2_000_000;

const ABI = [
  "function flexiblePool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function lockedPool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function periodFinish() view returns (uint256)",
  "function rewardTokens() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

// Deployment of the hardened 2026 contract: the age any profile should use
const DEPLOYED_AT = Date.UTC(2026, 9, 28) / 1000;

const stachPriceUsd = async () => {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${STACH}`
    );
    const pairs = (await res.json()).pairs || [];
    return Number(pairs[0]?.priceUsd) || 0;
  } catch {
    return 0;
  }
};

export async function fetchStachPools({ rpc } = {}) {
  const provider = new ethers.providers.JsonRpcProvider(
    rpc || process.env.BASE_RPC || "https://base-rpc.publicnode.com"
  );
  const c = new ethers.Contract(STACH, ABI, provider);
  const [flex, locked, finish, reserveLeft, contractBal, price] = await Promise.all([
    c.flexiblePool(),
    c.lockedPool(),
    c.periodFinish(),
    c.rewardTokens(),
    c.balanceOf(STACH),
    stachPriceUsd(),
  ]);

  const fmt = (x) => Number(ethers.utils.formatEther(x));
  const flexStaked = fmt(flex.totalLockedWeight) / WEIGHT;
  const reserve = fmt(reserveLeft);
  const lockedStaked = Math.max(fmt(contractBal) - reserve - flexStaked, 0);
  const lockedWeight = fmt(locked.totalLockedWeight) / WEIGHT;
  const daysLeft = Math.max(Math.floor((Number(finish) - Date.now() / 1000) / 86400), 0);
  const ageDays = Math.floor((Date.now() / 1000 - DEPLOYED_AT) / 86400);

  // Shared by both pools: the rate is emission ÷ stake, so it is a
  // statement about how few people have staked, not about demand
  const common = {
    ageDays,
    apyFromInterest: 0,
    apyFromIncentives: null, // set per pool below
    curatorFeePct: 0,
    curatorLabel: "protocol fee (there is none)",
    marketCount: null,
    topAllocationPct: null,
    topCollateral: null,
    emissionEndsInDays: daysLeft,
    reserveLeftStach: Math.round(reserve),
  };

  const pool = (id, name, staked, emission, { lockup }) => {
    const apy = staked > 0 ? Number(((emission / staked) * 100).toFixed(2)) : null;
    if (apy == null) return null;
    return {
      address: STACH,
      depositTo: STACH,
      symbol: id,
      name,
      asset: { address: STACH, symbol: "STACH", decimals: 18 },
      apy,
      tvlUsd: Math.round(staked * price),
      protocol: "stakechain",
      url: "https://stakechain-app.vercel.app/staking",
      risk: {
        ...common,
        apyFromIncentives: apy,
        // flexible exits on demand; locked cannot leave before its term
        utilizationPct: lockup ? 100 : 0,
        freeLiquidityUsd: lockup ? 0 : Math.round(staked * price),
        lockupMonths: lockup || null,
      },
      caption:
        `Fixed emission of ${emission.toLocaleString("en-US")} STACH divided among ` +
        `${Math.round(staked).toLocaleString("en-US")} staked, ending in ${daysLeft} days. ` +
        `The rate is high because few have staked, and falls as more do — it is not interest ` +
        `paid by a borrower.`,
    };
  };

  return [
    pool("STACH-flex", "StakeChain flexible staking", flexStaked, FLEX_EMISSION, {
      lockup: 0,
    }),
    pool("STACH-locked", "StakeChain locked staking (1-6 months)", lockedWeight, LOCKED_EMISSION, {
      lockup: 6,
    }),
  ].filter(Boolean);
}

/** The same pools as yields-table rows. */
export function asPoolRows(pools) {
  return pools.map((p) => ({
    project: "stakechain",
    symbol: p.symbol,
    category: "Staking",
    apy: p.apy,
    apyBase: 0,
    apyReward: p.apy,
    tvlUsd: p.tvlUsd,
    stablecoin: false,
    ilRisk: "no",
    pool: `stakechain-base-${p.symbol.toLowerCase()}`,
    url: p.url,
    llamaUrl: "https://github.com/Abstract36/StakeChain",
  }));
}
