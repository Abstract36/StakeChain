import React from "react";
import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

const pools = [
  {
    name: "Flexible pool",
    emission: "1,000,000 STACH / 360 days",
    rules: [
      "Stake and unstake at any time, no lock",
      "Stake weight proportional to amount",
      "Rewards accrue per second, claim whenever you like",
    ],
    tag: "no lock",
  },
  {
    name: "Locked pool",
    emission: "2,000,000 STACH / 360 days",
    rules: [
      "Lock for 1–6 months (30-day months)",
      "Stake weight grows with lock duration — 6 months earns 6× the weight of 1 month",
      "Unstake only after the lock expires",
    ],
    tag: "1–6 months",
  },
];

const Pools = () => {
  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        STACH Pools
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Two staking pools built into the STACH token contract. Fixed supply
        42M; a real 3M reserve inside the contract backs every reward. Audited
        — see docs/AUDIT-2026-10.md in the repository.
      </Typography>

      <Grid container spacing={2}>
        {pools.map((p) => (
          <Grid item xs={12} md={6} key={p.name}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h5" fontWeight="bold">
                    {p.name}
                  </Typography>
                  <Chip size="small" label={p.tag} />
                </Box>
                <Typography variant="body2" color="success.main" mb={2}>
                  Emission: {p.emission}
                </Typography>
                {p.rules.map((r) => (
                  <Typography key={r} variant="body2" color="text.secondary" mb={0.5}>
                    • {r}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Pools;
