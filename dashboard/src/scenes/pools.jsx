import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { TARGET_CHAIN } from "../hooks/useWallet";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";

const ABI = [
  "function flexiblePool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function lockedPool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function periodFinish() view returns (uint256)",
  "function rewardTokens() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const WEIGHT = 1e6;
const RESERVE = 3_000_000;

const fmt = (n, d = 0) =>
  n.toLocaleString(undefined, { maximumFractionDigits: d });

const Pools = () => {
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!STACH_ADDRESS) return setErr("Contract address not configured");
    (async () => {
      try {
        // public RPC: live stats without a wallet
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

        const daysLeft = Math.max(
          Math.floor((Number(finish) - Date.now() / 1000) / 86400),
          0
        );

        setS({
          flexStaked,
          lockedStaked,
          lockedWeight,
          reserve,
          distributed: RESERVE - reserve,
          daysLeft,
          // current rates if the program ran a full year at today's weights
          flexApr: flexStaked > 0 ? (1_000_000 / flexStaked) * 100 : null,
          locked6Apr: lockedWeight > 0 ? (2_000_000 / lockedWeight) * 100 : null,
        });
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
  }, []);

  const aprLabel = (v) =>
    v == null
      ? "be the first staker — the whole emission is yours"
      : v > 10000
      ? ">10,000% (near-empty pool)"
      : `${fmt(v, 1)}% APR at current participation`;

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        STACH Pools
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Two staking pools built into the STACH token contract. Fixed supply
        42M; a real {fmt(RESERVE)} STACH reserve inside the contract backs
        every reward —{" "}
        <a
          href="https://github.com/Abstract36/StakeChain/blob/main/docs/AUDIT-2026-10.md"
          target="_blank"
          rel="noreferrer"
          style={{ color: "inherit" }}
        >
          audited
        </a>
        . Live numbers below are read straight from the chain.
      </Typography>

      {err ? (
        <Typography color="error">{err}</Typography>
      ) : !s ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5" fontWeight="bold">
                      Flexible pool
                    </Typography>
                    <Chip size="small" label="no lock" />
                  </Box>
                  <Typography variant="body2" color="success.main" mb={1}>
                    Emission: 1,000,000 STACH / 360 days
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mb={0.5}>
                    {fmt(s.flexStaked, 2)} STACH
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    currently staked
                  </Typography>
                  <Typography variant="body1" color="success.main" mb={2}>
                    {aprLabel(s.flexApr)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Stake and unstake at any time
                    <br />• Weight proportional to amount
                    <br />• Rewards accrue per second
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5" fontWeight="bold">
                      Locked pool
                    </Typography>
                    <Chip size="small" label="1–6 months" />
                  </Box>
                  <Typography variant="body2" color="success.main" mb={1}>
                    Emission: 2,000,000 STACH / 360 days
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mb={0.5}>
                    {fmt(s.lockedStaked, 2)} STACH
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    currently locked
                  </Typography>
                  <Typography variant="body1" color="success.main" mb={2}>
                    {s.locked6Apr == null
                      ? aprLabel(null)
                      : s.locked6Apr > 10000
                      ? ">10,000% (near-empty pool)"
                      : `${fmt(s.locked6Apr, 1)}% APR at 6-month lock · ${fmt(
                          s.locked6Apr / 6,
                          1
                        )}% at 1-month`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Lock 1–6 months (30-day months)
                    <br />• 6-month weight = 6× the 1-month weight
                    <br />• Unstake after the lock expires
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
                <Typography variant="body1">
                  Reward program:{" "}
                  <b>{fmt(s.distributed, 2)}</b> of {fmt(RESERVE)} STACH
                  distributed
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  ends in <b>{s.daysLeft}</b> days
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(s.distributed / RESERVE) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>

          <Button variant="contained" onClick={() => navigate("/staking")}>
            Go stake
          </Button>
        </>
      )}
    </Box>
  );
};

export default Pools;
