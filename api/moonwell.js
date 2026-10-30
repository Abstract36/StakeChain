// Moonwell on Base — a Compound V2 fork, so neither the ERC-4626 nor the
// Aave shape fits: you supply by calling `mint` on the mToken itself and
// hold mTokens whose exchange rate grows, rather than a rebasing balance.
//
// Read from the protocol for the same reason as Aave: aggregators miss
// things. Moonwell's native-USDC market pays materially more than most of
// the Morpho shelf and does not show up in the yields snapshot at all.
//
// Note there are two mUSDC markets — the live one is on native USDC; the
// older bridged-USDbC market pays nothing and is deliberately left out.
import { ethers } from "ethers";

export const COMPTROLLER = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C";
const SECONDS_PER_YEAR = 31_536_000;

const MARKETS = [
  { symbol: "USDC", mToken: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "WETH", mToken: "0x628ff693426583D9a7FB391E54366292F509D457", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "cbBTC", mToken: "0xF877ACaFA28c19b96727966690b2f44d35aD5976", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "wstETH", mToken: "0x627Fe393Bc6EdDA28e99AE648fD6fF362514304b", address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18 },
  { symbol: "EURC", mToken: "0xb682c840B5F4FC58B20769E691A6fa1305A501a2", address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", decimals: 6 },
  { symbol: "AERO", mToken: "0x73902f619CEB9B31FD8EFecf435CbDf89E369Ba6", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18 },
  { symbol: "cbETH", mToken: "0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18 },
];

const MTOKEN_ABI = [
  "function supplyRatePerTimestamp() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function exchangeRateStored() view returns (uint256)",
  // the protocol's cut of borrower interest — Moonwell's analogue of a
  // vault curator's fee — and the pieces utilisation is computed from
  "function reserveFactorMantissa() view returns (uint256)",
  "function totalBorrows() view returns (uint256)",
  "function getCash() view returns (uint256)",
];
const ORACLE_ABI = ["function getUnderlyingPrice(address) view returns (uint256)"];
const COMPTROLLER_ABI = ["function oracle() view returns (address)"];

export async function fetchMoonwellMarkets({ rpc, minTvlUsd = 500_000, minApy = 0.05 } = {}) {
  const provider = new ethers.providers.JsonRpcProvider(
    rpc || process.env.BASE_RPC || "https://base-rpc.publicnode.com"
  );
  const oracleAddress = await new ethers.Contract(COMPTROLLER, COMPTROLLER_ABI, provider).oracle();
  const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);

  const rows = await Promise.all(
    MARKETS.map(async (m) => {
      const t = new ethers.Contract(m.mToken, MTOKEN_ABI, provider);
      const [rate, supply, exchangeRate, price, reserveFactor, borrows, cash] =
        await Promise.all([
          t.supplyRatePerTimestamp(),
          t.totalSupply(),
          t.exchangeRateStored(),
          oracle.getUnderlyingPrice(m.mToken),
          t.reserveFactorMantissa(),
          t.totalBorrows(),
          t.getCash(),
        ]);

      // per-second rate, compounded the way Moonwell's own UI reports it
      const apy = Number(
        ((Math.pow(1 + Number(rate) / 1e18, SECONDS_PER_YEAR) - 1) * 100).toFixed(2)
      );
      // mTokens are a claim on a growing pool: supply x exchange rate
      const underlying = Number(
        ethers.utils.formatUnits(
          supply.mul(exchangeRate).div(ethers.BigNumber.from(10).pow(18)),
          m.decimals
        )
      );
      // the oracle scales prices to 36 - underlying decimals
      const tvlUsd = Math.round(underlying * (Number(price.toString()) / 10 ** (36 - m.decimals)));

      if (tvlUsd < minTvlUsd || apy < minApy) return null;
      return {
        // mTokens are the position: balance x exchange rate is what you own
        address: m.mToken,
        // supplying calls mint() on the mToken, so it is also the approval target
        depositTo: m.mToken,
        symbol: `m${m.symbol}`,
        name: `Moonwell ${m.symbol}`,
        asset: { address: m.address, symbol: m.symbol, decimals: m.decimals },
        apy,
        tvlUsd,
        protocol: "moonwell",
        url: "https://moonwell.fi/markets/supply/base",
        // Same facts as a vault's `risk` block, in the shape a pool has
        // them. The APY above is the base supply rate, so WELL incentives
        // are not counted in it and are not claimed here either.
        risk: {
          curatorFeePct: Number(((Number(reserveFactor) / 1e18) * 100).toFixed(1)),
          curatorLabel: "protocol reserve factor",
          ageDays: null,
          apyFromInterest: apy,
          apyFromIncentives: 0,
          utilizationPct: Number(
            Math.min(
              (Number(borrows) / Math.max(Number(cash) + Number(borrows), 1)) * 100,
              100
            ).toFixed(1)
          ),
          freeLiquidityUsd: Math.round(
            Number(ethers.utils.formatUnits(cash, m.decimals)) *
              (Number(price.toString()) / 10 ** (36 - m.decimals))
          ),
          marketCount: null,
          topAllocationPct: null,
          topCollateral: null,
        },
      };
    })
  );
  return rows.filter(Boolean);
}

const STABLES = new Set(["USDC", "EURC"]);

/** The same markets as yields-table rows. */
export function asPoolRows(markets) {
  return markets.map((m) => ({
    project: "moonwell",
    symbol: m.asset.symbol.toUpperCase(),
    category: "Lending",
    apy: m.apy,
    apyBase: m.apy,
    apyReward: null,
    tvlUsd: m.tvlUsd,
    stablecoin: STABLES.has(m.asset.symbol.toUpperCase()),
    ilRisk: "no",
    pool: `moonwell-base-${m.asset.symbol.toLowerCase()}`,
    url: m.url,
    llamaUrl: "https://defillama.com/protocol/moonwell",
  }));
}
