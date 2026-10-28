import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ethers } from "ethers";
import useWallet from "../hooks/useWallet";

const API_URL = process.env.REACT_APP_YIELDS_API || "http://localhost:4000";
// Morpho Blue singleton (same address on every chain)
const MORPHO = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";
const ORACLE_SCALE = ethers.BigNumber.from(10).pow(36);
const WAD = ethers.BigNumber.from(10).pow(18);

const MORPHO_ABI = [
  "function position(bytes32 id, address user) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)",
  "function market(bytes32 id) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)",
  "function supplyCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)",
  "function withdrawCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, address receiver)",
  "function borrow((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)",
  "function repay((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)",
];
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
];
const ORACLE_ABI = ["function price() view returns (uint256)"];

const paramsOf = (m) => ({
  loanToken: m.loanAsset.address,
  collateralToken: m.collateralAsset.address,
  oracle: m.oracle,
  irm: m.irm,
  lltv: m.lltv,
});

const fmt = (n, d = 4) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

const Borrow = () => {
  const { account, chainId, connect, ensureTargetChain } = useWallet();
  const onBase = chainId === "0x2105";
  const [markets, setMarkets] = useState(null);
  const [mkt, setMkt] = useState(null);
  const [pos, setPos] = useState(null);
  const [collIn, setCollIn] = useState("");
  const [borrowIn, setBorrowIn] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/markets`)
      .then((r) => r.json())
      .then((d) => {
        setMarkets(d.markets);
        setMkt(d.markets[0] || null);
      })
      .catch(() => setMarkets([]));
  }, []);

  const provider = () => new ethers.providers.Web3Provider(window.ethereum);

  const refresh = useCallback(async () => {
    if (!account || !onBase || !mkt) return;
    const p = provider();
    const morpho = new ethers.Contract(MORPHO, MORPHO_ABI, p);
    const [position, marketTotals, price, collBal, usdcBal] = await Promise.all([
      morpho.position(mkt.marketId, account),
      morpho.market(mkt.marketId),
      new ethers.Contract(mkt.oracle, ORACLE_ABI, p).price(),
      new ethers.Contract(mkt.collateralAsset.address, ERC20_ABI, p).balanceOf(account),
      new ethers.Contract(mkt.loanAsset.address, ERC20_ABI, p).balanceOf(account),
    ]);
    // debt in loan assets = shares * totalBorrowAssets / totalBorrowShares (ceil)
    const debt = marketTotals.totalBorrowShares.isZero()
      ? ethers.BigNumber.from(0)
      : ethers.BigNumber.from(position.borrowShares)
          .mul(marketTotals.totalBorrowAssets)
          .add(marketTotals.totalBorrowShares.sub(1))
          .div(marketTotals.totalBorrowShares);
    // collateral value in loan units = collateral * price / 1e36
    const collValue = ethers.BigNumber.from(position.collateral)
      .mul(price)
      .div(ORACLE_SCALE);
    const maxBorrow = collValue.mul(mkt.lltv).div(WAD);
    setPos({
      collateral: position.collateral,
      borrowShares: position.borrowShares,
      debt,
      collValue,
      maxBorrow,
      price,
      collBal,
      usdcBal,
    });
  }, [account, onBase, mkt]);

  useEffect(() => {
    setPos(null);
    refresh().catch(() => {});
  }, [refresh]);

  const run = async (label, fn) => {
    setBusy(true);
    setStatus({ type: "info", msg: `${label}…` });
    try {
      await fn(new ethers.Contract(MORPHO, MORPHO_ABI, provider().getSigner()));
      setStatus({ type: "success", msg: `${label}: confirmed` });
      await refresh();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message });
    } finally {
      setBusy(false);
    }
  };

  const approveIfNeeded = async (token, amount) => {
    const signer = provider().getSigner();
    const erc20 = new ethers.Contract(token, ERC20_ABI, signer);
    const allowance = await erc20.allowance(account, MORPHO);
    if (allowance.lt(amount)) {
      setStatus({ type: "info", msg: "Approving token…" });
      await (await erc20.approve(MORPHO, amount)).wait();
    }
  };

  const doSupply = () =>
    run("Supply collateral", async (m) => {
      const amt = ethers.utils.parseUnits(collIn, mkt.collateralAsset.decimals);
      await approveIfNeeded(mkt.collateralAsset.address, amt);
      await (await m.supplyCollateral(paramsOf(mkt), amt, account, "0x")).wait();
      setCollIn("");
    });

  const doBorrow = () =>
    run("Borrow", async (m) => {
      const amt = ethers.utils.parseUnits(borrowIn, mkt.loanAsset.decimals);
      await (await m.borrow(paramsOf(mkt), amt, 0, account, account)).wait();
      setBorrowIn("");
    });

  const doRepayAll = () =>
    run("Repay all", async (m) => {
      // repay by shares clears the debt exactly; approve a little extra dust
      const buffer = pos.debt.mul(10001).div(10000).add(1);
      await approveIfNeeded(mkt.loanAsset.address, buffer);
      await (await m.repay(paramsOf(mkt), 0, pos.borrowShares, account, "0x")).wait();
    });

  const doWithdrawAll = () =>
    run("Withdraw collateral", async (m) => {
      await (
        await m.withdrawCollateral(paramsOf(mkt), pos.collateral, account, account)
      ).wait();
    });

  // projected numbers for the inputs
  const dec = (bn, d) => Number(ethers.utils.formatUnits(bn || 0, d));
  const projCollValue = pos
    ? dec(pos.collValue, mkt.loanAsset.decimals) +
      (Number(collIn) || 0) * dec(pos.price, 36 - mkt.collateralAsset.decimals + mkt.loanAsset.decimals)
    : 0;
  const projDebt = pos ? dec(pos.debt, mkt.loanAsset.decimals) + (Number(borrowIn) || 0) : 0;
  const lltvPct = mkt ? Number(mkt.lltv) / 1e16 : 0;
  const maxSafeBorrow = projCollValue * (lltvPct / 100) * 0.9 - (pos ? dec(pos.debt, mkt.loanAsset.decimals) : 0);
  const ltv = projCollValue > 0 ? (projDebt / projCollValue) * 100 : 0;
  const health = lltvPct > 0 ? Math.max(0, 100 - (ltv / lltvPct) * 100) : 0;

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Borrow
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Take a USDC loan against your collateral through audited Morpho Blue
        markets. Over-collateralized: if your LTV reaches the market's
        liquidation threshold, the protocol liquidates the collateral — keep a
        safety margin. We are an interface, not a counterparty.
      </Typography>

      {status && (
        <Alert severity={status.type} sx={{ mb: 2, maxWidth: 720 }} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      {!markets ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : !markets.length ? (
        <Typography color="text.secondary">Markets unavailable — is the API running?</Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <TextField
                  select fullWidth size="small" label="Market" value={mkt?.marketId || ""}
                  sx={{ mb: 2 }}
                  onChange={(e) => setMkt(markets.find((m) => m.marketId === e.target.value))}
                >
                  {markets.map((m) => (
                    <MenuItem key={m.marketId} value={m.marketId}>
                      {m.collateralAsset.symbol} → {m.loanAsset.symbol} · {m.borrowApy}% APR ·
                      LLTV {Number(m.lltv) / 1e16}%
                    </MenuItem>
                  ))}
                </TextField>

                {!account ? (
                  <Button variant="contained" onClick={() => connect({ ensureChain: true }).catch(() => {})} disabled={!window.ethereum}>
                    {window.ethereum ? "Connect wallet" : "No wallet detected"}
                  </Button>
                ) : !onBase ? (
                  <Button variant="contained" color="warning" onClick={() => ensureTargetChain().catch(() => {})}>
                    Switch to Base
                  </Button>
                ) : !pos ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      1. Supply collateral ({mkt.collateralAsset.symbol} · wallet:{" "}
                      {fmt(dec(pos.collBal, mkt.collateralAsset.decimals))})
                    </Typography>
                    <Box display="flex" gap={1} mb={2} mt={0.5}>
                      <TextField
                        size="small" fullWidth placeholder="0.0" value={collIn}
                        onChange={(e) => setCollIn(e.target.value)}
                      />
                      <Button variant="outlined" disabled={busy || !collIn} onClick={doSupply}>
                        Supply
                      </Button>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      2. Borrow USDC (safe max ≈ {fmt(Math.max(maxSafeBorrow, 0), 2)})
                    </Typography>
                    <Box display="flex" gap={1} mb={2} mt={0.5}>
                      <TextField
                        size="small" fullWidth placeholder="0.0" value={borrowIn}
                        onChange={(e) => setBorrowIn(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        disabled={busy || !borrowIn || Number(borrowIn) > Math.max(maxSafeBorrow, 0)}
                        onClick={doBorrow}
                      >
                        Borrow
                      </Button>
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Position health (liquidation at {lltvPct}% LTV; now {fmt(ltv, 1)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((ltv / lltvPct) * 100 || 0, 100)}
                      color={health > 40 ? "success" : health > 15 ? "warning" : "error"}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />

                    <Box display="flex" gap={1}>
                      <Button size="small" variant="outlined" disabled={busy || pos.borrowShares === 0 || pos.debt.isZero()} onClick={doRepayAll}>
                        Repay all ({fmt(dec(pos.debt, mkt.loanAsset.decimals), 2)} USDC)
                      </Button>
                      <Button
                        size="small" variant="outlined"
                        disabled={busy || !pos.debt.isZero() || ethers.BigNumber.from(pos.collateral).isZero()}
                        onClick={doWithdrawAll}
                      >
                        Withdraw collateral
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={1}>Your position</Typography>
                {pos && mkt ? (
                  <>
                    <Typography variant="body2" mb={0.5}>
                      Collateral: <b>{fmt(dec(pos.collateral, mkt.collateralAsset.decimals))} {mkt.collateralAsset.symbol}</b>
                      {" "}(≈ {fmt(dec(pos.collValue, mkt.loanAsset.decimals), 2)} USDC)
                    </Typography>
                    <Typography variant="body2" mb={0.5}>
                      Debt: <b>{fmt(dec(pos.debt, mkt.loanAsset.decimals), 2)} USDC</b> at {mkt.borrowApy}% APR
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Borrow capacity: {fmt(dec(pos.maxBorrow, mkt.loanAsset.decimals), 2)} USDC
                    </Typography>
                    <Chip
                      size="small" sx={{ mt: 1 }}
                      color={health > 40 ? "success" : health > 15 ? "warning" : "error"}
                      label={pos.debt.isZero() ? "no debt" : `health margin ${fmt(health, 0)}%`}
                    />
                  </>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Connect on Base to see it.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Borrow;
