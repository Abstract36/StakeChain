import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControlLabel,
  Switch,
  Link,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useStachPools from "../hooks/useStachPools";

const API_URL = process.env.REACT_APP_YIELDS_API || "http://localhost:4000";
// Fallback: query DefiLlama directly if the local API is not running
const LLAMA_URL = "https://yields.llama.fi/pools";

const fmtTvl = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}k`;

const Yields = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetFilter, setAssetFilter] = useState("");
  const [stableOnly, setStableOnly] = useState(false);
  const [source, setSource] = useState("");

  // vault list lets us turn Morpho rows into in-app deposits
  useEffect(() => {
    fetch(`${API_URL}/vaults`)
      .then((r) => r.json())
      .then((d) => setVaults(d.vaults || []))
      .catch(() => {});
  }, []);

  const vaultFor = (p) =>
    p.project === "morpho-blue"
      ? vaults.find((v) => v.symbol.toLowerCase() === p.symbol.toLowerCase())
      : null;

  // our own product goes first on the shelf
  const { stats: stach } = useStachPools();
  const aprText = (v) =>
    v == null ? "be first" : v > 10000 ? ">10,000%" : `${v.toFixed(1)}%`;
  const ownRows = stach
    ? [
        {
          own: true,
          project: "stakechain",
          symbol: "STACH · flexible",
          apyText: aprText(stach.flexApr),
          early: stach.flexApr == null || stach.flexApr > 1000,
          tvlText: `${stach.flexStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })} STACH`,
          tag: "no lock",
        },
        {
          own: true,
          project: "stakechain",
          symbol: "STACH · locked 1–6 mo",
          apyText: `${aprText(stach.locked6Apr)} @6mo`,
          early: stach.locked6Apr == null || stach.locked6Apr > 1000,
          tvlText: `${stach.lockedStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })} STACH`,
          tag: "locked",
        },
      ]
    : [];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/yields`);
        if (!res.ok) throw new Error("api down");
        const data = await res.json();
        setPools(data.pools);
        setSource("StakeChain API");
      } catch {
        try {
          const res = await fetch(LLAMA_URL);
          const { data } = await res.json();
          const filtered = data
            .filter((p) => p.chain === "Base" && p.tvlUsd > 100000 && p.apy > 0)
            .sort((a, b) => b.tvlUsd - a.tvlUsd)
            .slice(0, 25)
            .map((p) => ({
              project: p.project,
              symbol: p.symbol,
              apy: Number(p.apy.toFixed(2)),
              tvlUsd: Math.round(p.tvlUsd),
              stablecoin: !!p.stablecoin,
              pool: p.pool,
              url: `https://defillama.com/yields/pool/${p.pool}`,
            }));
          setPools(filtered);
          setSource("DefiLlama (direct)");
        } catch (e) {
          setError("Failed to load yields data");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible = useMemo(
    () =>
      pools.filter(
        (p) =>
          (!stableOnly || p.stablecoin) &&
          (!assetFilter ||
            p.symbol.toUpperCase().includes(assetFilter.toUpperCase()) ||
            p.project.toUpperCase().includes(assetFilter.toUpperCase()))
      ),
    [pools, assetFilter, stableOnly]
  );

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Base Staking Yields
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Live staking and lending rates across Base protocols. Data refreshes
        every 5 minutes{source ? ` · source: ${source}` : ""}. AI agents can
        consume this data via MCP / x402 — see the docs.
      </Typography>

      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField
          size="small"
          label="Filter by asset or protocol"
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
        />
        <FormControlLabel
          control={
            <Switch checked={stableOnly} onChange={(e) => setStableOnly(e.target.checked)} />
          }
          label="Stablecoins only"
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell align="right">APY</TableCell>
                <TableCell align="right">TVL</TableCell>
                <TableCell>Type</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {ownRows.map((r) => (
                <TableRow
                  key={r.symbol}
                  hover
                  sx={{ "& td": { borderLeft: "none" }, backgroundColor: "rgba(124,140,255,0.07)" }}
                >
                  <TableCell>★</TableCell>
                  <TableCell sx={{ textTransform: "capitalize", fontWeight: 700 }}>
                    {r.project}
                  </TableCell>
                  <TableCell>{r.symbol}</TableCell>
                  <TableCell align="right">
                    <Typography component="span" fontWeight="bold" color="success.main">
                      {r.apyText}
                    </Typography>
                    {r.early && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        early stage: fixed emission ÷ few stakers, paid in STACH; rate falls as the pool fills
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{r.tvlText}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.tag} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" onClick={() => navigate("/staking")}>
                      Stake
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.map((p, i) => (
                <TableRow key={p.pool} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{p.project}</TableCell>
                  <TableCell>{p.symbol}</TableCell>
                  <TableCell align="right">
                    <Typography component="span" fontWeight="bold" color="success.main">
                      {p.apy}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{fmtTvl(p.tvlUsd)}</TableCell>
                  <TableCell>
                    {p.stablecoin ? <Chip size="small" label="stable" /> : <Chip size="small" label="volatile" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    {vaultFor(p) ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/earn?vault=${vaultFor(p).address}`)}
                      >
                        Deposit
                      </Button>
                    ) : (
                      <Link href={p.url} target="_blank" rel="noreferrer">
                        details
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Yields;
