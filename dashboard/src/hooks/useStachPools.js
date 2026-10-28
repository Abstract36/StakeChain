import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { TARGET_CHAIN } from "./useWallet";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";

const ABI = [
  "function flexiblePool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function lockedPool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function periodFinish() view returns (uint256)",
  "function rewardTokens() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const WEIGHT = 1e6;
export const STACH_RESERVE = 3_000_000;

// Live stats of the built-in STACH staking pools, read over public RPC —
// shared by the Pools scene and the pinned rows of the Yields table.
export default function useStachPools() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!STACH_ADDRESS) return setError("Contract address not configured");
    (async () => {
      try {
        const p = new ethers.providers.JsonRpcProvider(TARGET_CHAIN.rpcUrls[0]);
        const c = new ethers.Contract(STACH_ADDRESS, ABI, p);
        const [flex, locked, finish, reserveLeft, contractBal] =
          await Promise.all([
            c.flexiblePool(),
            c.lockedPool(),
            c.periodFinish(),
            c.rewardTokens(),
            c.balanceOf(STACH_ADDRESS),
          ]);

        const flexStaked =
          Number(ethers.utils.formatEther(flex.totalLockedWeight)) / WEIGHT;
        const reserve = Number(ethers.utils.formatEther(reserveLeft));
        const totalDeposits =
          Number(ethers.utils.formatEther(contractBal)) - reserve;
        const lockedStaked = Math.max(totalDeposits - flexStaked, 0);
        const lockedWeight =
          Number(ethers.utils.formatEther(locked.totalLockedWeight)) / WEIGHT;

        setStats({
          flexStaked,
          lockedStaked,
          lockedWeight,
          reserve,
          distributed: STACH_RESERVE - reserve,
          daysLeft: Math.max(
            Math.floor((Number(finish) - Date.now() / 1000) / 86400),
            0
          ),
          flexApr: flexStaked > 0 ? (1_000_000 / flexStaked) * 100 : null,
          locked6Apr:
            lockedWeight > 0 ? (2_000_000 / lockedWeight) * 100 : null,
        });
      } catch (e) {
        setError(String(e.message || e));
      }
    })();
  }, []);

  return { stats, error };
}
