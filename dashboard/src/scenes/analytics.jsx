import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ethers } from "ethers";
import useWallet, { TARGET_CHAIN_ID } from "../hooks/useWallet";

const API_URL = process.env.REACT_APP_YIELDS_API || "http://localhost:4000";
const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";
// first block to scan for the user's STACH events (contract deploy height)
const DEPLOY_BLOCK = Number(process.env.REACT_APP_STACH_DEPLOY_BLOCK || 53190000);

const STACH_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function rewards(address) view returns (uint256)",
  "function flexibleStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "function lockedStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "event Staked(address indexed user, bool indexed locked, uint256 amount, uint256 weight)",
  "event Unstaked(address indexed user, bool indexed locked, uint256 amount)",
  "event RewardsWithdrawn(address indexed user, uint256 amount)",
];
const VAULT_ABI = ["function maxWithdraw(address) view returns (uint256)"];

const fmt = (bn) =>
  bn
    ? Number(ethers.utils.formatEther(bn)).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
    : "0";
const fmtUsd = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`;

const Analytics = () => {
  const { account, chainId, connect } = useWallet();
  const onTarget = chainId === TARGET_CHAIN_ID;
  const [stach, setStach] = useState(null);
  const [history, setHistory] = useState(null);
  const [earnPos, setEarnPos] = useState(null);
  const [market, setMarket] = useState(null);

  // ----- personal: STACH positions + on-chain history -----
  const loadPersonal = useCallback(async () => {
    if (!account || !onTarget || !STACH_ADDRESS) return;
    const p = new ethers.providers.Web3Provider(window.ethereum);
    const c = new ethers.Contract(STACH_ADDRESS, STACH_ABI, p);

    const [balance, pending, flex, locked] = await Promise.all([
      c.balanceOf(account),
      c.rewards(account),
      c.flexibleStakingUsers(account),
      c.lockedStakingUsers(account),
    ]);

    const [stakes, unstakes, claims] = await Promise.all([
      c.queryFilter(c.filters.Staked(account), DEPLOY_BLOCK),
      c.queryFilter(c.filters.Unstaked(account), DEPLOY_BLOCK),
      c.queryFilter(c.filters.RewardsWithdrawn(account), DEPLOY_BLOCK),
    ]);

    const events = [...stakes, ...unstakes, ...claims].sort(
      (a, b) => b.blockNumber - a.blockNumber
    );
    const blocks = await Promise.all(
      events.slice(0, 20).map((e) => p.getBlock(e.blockNumber))
    );
    const rows = events.slice(0, 20).map((e, i) => ({
      key: e.transactionHash + e.logIndex,
      date: new Date(blocks[i].timestamp * 1000).toLocaleString(),
      kind:
        e.event === "Staked"
          ? `Stake (${e.args.locked ? "locked" : "flexible"})`
          : e.event === "Unstaked"
          ? `Unstake (${e.args.locked ? "locked" : "flexible"})`
          : "Rewards claimed",
      amount: fmt(e.args.amount),
    }));

    const totalClaimed = claims.reduce(
      (s, e) => s.add(e.args.amount),
      ethers.BigNumber.from(0)
    );

    setStach({
      balance,
      pending,
      flexStaked: flex.tokenAmount,
      lockedStaked: locked.tokenAmount,
      totalClaimed,
    });
    setHistory(rows);
  }, [account, onTarget]);

  useEffect(() => {
    loadPersonal().catch(() => {});
  }, [loadPersonal]);

  // ----- personal: Morpho vault deposits -----
  useEffect(() => {
    if (!account || !onTarget) return;
    (async () => {
      try {
        const { vaults } = await (await fetch(`${API_URL}/vaults`)).json();
        const p = new ethers.providers.Web3Provider(window.ethereum);
        const positions = [];
        for (const v of vaults.slice(0, 10)) {
          const bal = await new ethers.Contract(v.address, VAULT_ABI, p).maxWithdraw(account);
          if (!bal.isZero()) {
            positions.push({
              ...v,
              deposited: Number(ethers.utils.formatUnits(bal, v.asset.decimals)),
            });
          }
        }
        setEarnPos(positions);
      } catch {
        setEarnPos([]);
      }
    })();
  }, [account, onTarget]);

  // ----- market summary (secondary) -----
  useEffect(() => {
    fetch(`${API_URL}/yields`)
      .then((r) => r.json())
      .then((d) => setMarket(d.pools))
      .catch(() => setMarket([]));
  }, []);

  const marketStats = useMemo(() => {
    if (!market || !market.length) return null;
    const tvl = market.reduce((s, p) => s + p.tvlUsd, 0);
    const top = market.reduce((m, p) => (p.apy > m.apy ? p : m), market[0]);
    return { tvl, top, count: market.length };
  }, [market]);

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Portfolio
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Your positions, history and earnings — read directly from the chain.
      </Typography>

      {!account ? (
        <Button
          variant="contained"
          onClick={() => connect({ ensureChain: true }).catch(() => {})}
          disabled={!window.ethereum}
          sx={{ mb: 3 }}
        >
          {window.ethereum ? "Connect wallet to see your stats" : "No wallet detected"}
        </Button>
      ) : !onTarget ? (
        <Typography color="warning.main" mb={3}>
          Switch the wallet to the app's network to load your positions.
        </Typography>
      ) : !stach ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} mb={3}>
            {[
              ["STACH in wallet", `${fmt(stach.balance)}`],
              ["Staked (flexible)", `${fmt(stach.flexStaked)}`],
              ["Staked (locked)", `${fmt(stach.lockedStaked)}`],
              ["Pending rewards", `${fmt(stach.pending)}`],
              ["Rewards claimed (all time)", `${fmt(stach.totalClaimed)}`],
            ].map(([label, value]) => (
              <Grid item xs={6} md={2.4} key={label}>
                <Card sx={{ height: "100%" }}>
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

          {earnPos && earnPos.length > 0 && (
            <>
              <Typography variant="h5" mb={1}>
                Lending positions (Morpho)
              </Typography>
              <Grid container spacing={2} mb={3}>
                {earnPos.map((v) => (
                  <Grid item xs={12} sm={6} md={4} key={v.address}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {v.name || v.symbol} <Chip size="small" label={`${v.apy}% APY`} sx={{ ml: 1 }} />
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {v.deposited.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                          {v.asset.symbol}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          <Typography variant="h5" mb={1}>
            History
          </Typography>
          {!history || !history.length ? (
            <Typography color="text.secondary" mb={3}>
              No STACH activity yet — stake something and it will show up here.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 3, maxWidth: 720 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Amount (STACH)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.kind}</TableCell>
                      <TableCell align="right">{r.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {marketStats && (
        <>
          <Typography variant="h5" mb={1}>
            Market snapshot
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {marketStats.count} Base pools tracked · combined TVL{" "}
            {fmtUsd(marketStats.tvl)} · top APY {marketStats.top.apy}% (
            {marketStats.top.project})
          </Typography>
        </>
      )}
    </Box>
  );
};

export default Analytics;
