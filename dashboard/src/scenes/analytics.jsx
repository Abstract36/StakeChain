import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Grid, Typography, CircularProgress } from "@mui/material";

const API_URL = process.env.REACT_APP_YIELDS_API || "http://localhost:4000";

const fmtUsd = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`;

const Analytics = () => {
  const [pools, setPools] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/yields`)
      .then((r) => r.json())
      .then((d) => setPools(d.pools))
      .catch(() => setPools([]));
  }, []);

  const stats = useMemo(() => {
    if (!pools || !pools.length) return null;
    const tvl = pools.reduce((s, p) => s + p.tvlUsd, 0);
    const apys = pools.map((p) => p.apy).sort((a, b) => a - b);
    const median = apys[Math.floor(apys.length / 2)];
    const top = pools.reduce((m, p) => (p.apy > m.apy ? p : m), pools[0]);
    const stables = pools.filter((p) => p.stablecoin).length;
    return { tvl, median, top, stables, count: pools.length };
  }, [pools]);

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Aggregator Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Summary of the Base pools currently tracked by the aggregator.
      </Typography>

      {!pools ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : !stats ? (
        <Typography color="text.secondary">
          No data — is the yields API running on {API_URL}?
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {[
            ["Pools tracked", stats.count],
            ["Combined TVL", fmtUsd(stats.tvl)],
            ["Median APY", `${stats.median}%`],
            ["Stablecoin pools", `${stats.stables} of ${stats.count}`],
            [
              "Top APY",
              `${stats.top.apy}% — ${stats.top.project} (${stats.top.symbol})`,
            ],
          ].map(([label, value]) => (
            <Grid item xs={12} sm={6} md={4} key={label}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
