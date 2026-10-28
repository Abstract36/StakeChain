import React from "react";
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
import useStachPools, { STACH_RESERVE as RESERVE } from "../hooks/useStachPools";

const fmt = (n, d = 0) =>
  n.toLocaleString(undefined, { maximumFractionDigits: d });

const Pools = () => {
  const navigate = useNavigate();
  const { stats: s, error: err } = useStachPools();

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
