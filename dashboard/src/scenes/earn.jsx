import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ethers } from "ethers";
import useWallet from "../hooks/useWallet";

const API_URL = process.env.REACT_APP_YIELDS_API || "http://localhost:4000";

// ERC-20 + ERC-4626: everything a lend/withdraw flow needs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];
const VAULT_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];
// Aave V3 supplies through one Pool contract and holds the position as an
// aToken, so its three calls differ from the ERC-4626 path above.
const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
];
const ATOKEN_ABI = ["function balanceOf(address) view returns (uint256)"];

const isAave = (v) => v?.protocol === "aave";
// where an approval and the deposit call must go
const spenderOf = (v) => v.depositTo || v.address;

const fmtUsd = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`;

const Earn = () => {
  const { account, chainId, connect, ensureTargetChain } = useWallet();
  const onBase = chainId === "0x2105";
  const [vaults, setVaults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [pos, setPos] = useState(null); // { walletBal, deposited }
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/vaults`)
      .then((r) => r.json())
      .then((d) => {
        setVaults(d.vaults);
        // deep link from the Yields table: /earn?vault=0x...
        const want = new URLSearchParams(window.location.search).get("vault");
        if (want) {
          const v = d.vaults.find(
            (x) => x.address.toLowerCase() === want.toLowerCase()
          );
          if (v) setSelected(v);
        }
      })
      .catch(() => setVaults([]));
  }, []);

  const provider = useCallback(
    () => new ethers.providers.Web3Provider(window.ethereum),
    []
  );

  const refreshPosition = useCallback(async () => {
    if (!account || !selected || !onBase) return;
    const p = provider();
    const asset = new ethers.Contract(selected.asset.address, ERC20_ABI, p);
    // aToken balances are the Aave position; ERC-4626 reports maxWithdraw
    const position = isAave(selected)
      ? new ethers.Contract(selected.address, ATOKEN_ABI, p).balanceOf(account)
      : new ethers.Contract(selected.address, VAULT_ABI, p).maxWithdraw(account);
    const [walletBal, deposited] = await Promise.all([
      asset.balanceOf(account),
      position,
    ]);
    setPos({ walletBal, deposited });
  }, [account, selected, onBase, provider]);

  useEffect(() => {
    setPos(null);
    refreshPosition().catch(() => {});
  }, [refreshPosition]);

  const fmtAsset = (bn) =>
    bn
      ? Number(
          ethers.utils.formatUnits(bn, selected.asset.decimals)
        ).toLocaleString(undefined, { maximumFractionDigits: 4 })
      : "0";

  const run = async (label, fn) => {
    setBusy(true);
    setStatus({ type: "info", msg: `${label}…` });
    try {
      await fn();
      setStatus({ type: "success", msg: `${label}: confirmed` });
      await refreshPosition();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message });
    } finally {
      setBusy(false);
    }
  };

  const deposit = () =>
    run("Deposit", async () => {
      const signer = provider().getSigner();
      const units = ethers.utils.parseUnits(amount, selected.asset.decimals);
      const asset = new ethers.Contract(selected.asset.address, ERC20_ABI, signer);
      const spender = spenderOf(selected);
      const allowance = await asset.allowance(account, spender);
      if (allowance.lt(units)) {
        const txA = await asset.approve(spender, units);
        await txA.wait();
      }
      const tx = isAave(selected)
        ? await new ethers.Contract(spender, AAVE_POOL_ABI, signer).supply(
            selected.asset.address,
            units,
            account,
            0
          )
        : await new ethers.Contract(selected.address, VAULT_ABI, signer).deposit(units, account);
      await tx.wait();
    });

  const withdraw = () =>
    run("Withdraw", async () => {
      const signer = provider().getSigner();
      const units = ethers.utils.parseUnits(amount, selected.asset.decimals);
      // Interest accrues every block, so a figure typed a moment ago is
      // already stale. Asking for the whole position exits by shares
      // instead of by amount, which leaves no dust and cannot overdraw.
      const exitingAll = pos?.deposited && units.gte(pos.deposited);
      let tx;
      if (isAave(selected)) {
        const pool = new ethers.Contract(spenderOf(selected), AAVE_POOL_ABI, signer);
        tx = await pool.withdraw(
          selected.asset.address,
          exitingAll ? ethers.constants.MaxUint256 : units,
          account
        );
      } else {
        const vault = new ethers.Contract(selected.address, VAULT_ABI, signer);
        tx = exitingAll
          ? await vault.redeem(await vault.balanceOf(account), account, account)
          : await vault.withdraw(units, account, account);
      }
      await tx.wait();
    });

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Earn — lend on Base
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Lend assets to borrowers through audited Morpho vaults (ERC-4626) and
        Aave V3 reserves, and earn the rates below. Borrowers post collateral
        and are liquidated by those protocols — your deposit goes straight to
        their contracts, never through us. This is an interface, not custody.
        Aave rates and sizes are read from the Pool contract itself. <strong>Fee</strong>
        {" "}is the curator's cut, taken before the rate shown; <strong>Age</strong> is how
        long the vault has run. Both change what a rate is worth and neither is
        usually displayed next to one.
      </Typography>

      {status && (
        <Alert severity={status.type} sx={{ mb: 2, maxWidth: 720 }} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      {!vaults ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : !vaults.length ? (
        <Typography color="text.secondary">
          Vault list unavailable — is the yields API running?
        </Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Market</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">APY</TableCell>
                    <TableCell align="right">Fee</TableCell>
                    <TableCell align="right">Age</TableCell>
                    <TableCell align="right">TVL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaults.map((v) => (
                    <TableRow
                      key={v.address}
                      hover
                      selected={selected?.address === v.address}
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelected(v)}
                    >
                      <TableCell>{v.name || v.symbol}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={isAave(v) ? "Aave V3" : "Morpho"}
                        />
                      </TableCell>
                      <TableCell>{v.asset.symbol}</TableCell>
                      <TableCell align="right">
                        <Typography component="span" fontWeight="bold" color="success.main">
                          {v.apy}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {/* what the curator keeps before the rate you see */}
                        <Typography
                          component="span"
                          variant="body2"
                          color={v.risk?.curatorFeePct >= 15 ? "warning.main" : "text.secondary"}
                        >
                          {v.risk ? `${v.risk.curatorFeePct}%` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography component="span" variant="body2" color="text.secondary">
                          {v.risk?.ageDays != null
                            ? v.risk.ageDays >= 365
                              ? `${Math.floor(v.risk.ageDays / 365)}y`
                              : `${v.risk.ageDays}d`
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{fmtUsd(v.tvlUsd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                {!selected ? (
                  <Typography color="text.secondary">
                    Select a vault to deposit or withdraw.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h5" mb={0.5}>
                      {selected.name || selected.symbol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {selected.asset.symbol} · {selected.apy}% APY ·{" "}
                      <Link href={selected.url} target="_blank" rel="noreferrer">
                        vault on Morpho
                      </Link>
                    </Typography>

                    {!account ? (
                      <Button
                        variant="contained"
                        onClick={() => connect({ ensureChain: true }).catch(() => {})}
                        disabled={!window.ethereum}
                      >
                        {window.ethereum ? "Connect wallet" : "No wallet detected"}
                      </Button>
                    ) : !onBase ? (
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => ensureTargetChain().catch(() => {})}
                      >
                        Switch to Base
                      </Button>
                    ) : (
                      <>
                        <Typography variant="body2" mb={0.5}>
                          Wallet: {fmtAsset(pos?.walletBal)} {selected.asset.symbol}{" "}
                          <Link
                            component="button"
                            onClick={() =>
                              pos?.walletBal &&
                              setAmount(ethers.utils.formatUnits(pos.walletBal, selected.asset.decimals))
                            }
                          >
                            MAX
                          </Link>
                        </Typography>
                        <Typography variant="body2" mb={2}>
                          Deposited: {fmtAsset(pos?.deposited)} {selected.asset.symbol}{" "}
                          {pos?.deposited && !pos.deposited.isZero() && (
                            <Link
                              component="button"
                              type="button"
                              underline="hover"
                              onClick={() =>
                                setAmount(
                                  ethers.utils.formatUnits(pos.deposited, selected.asset.decimals)
                                )
                              }
                            >
                              ALL
                            </Link>
                          )}
                        </Typography>
                        <TextField
                          size="small"
                          fullWidth
                          label={`Amount (${selected.asset.symbol})`}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            disabled={
                              busy ||
                              !amount ||
                              (pos?.walletBal &&
                                Number(amount) >
                                  Number(
                                    ethers.utils.formatUnits(pos.walletBal, selected.asset.decimals)
                                  ))
                            }
                            onClick={deposit}
                          >
                            Deposit
                          </Button>
                          <Button variant="outlined" disabled={busy || !amount} onClick={withdraw}>
                            Withdraw
                          </Button>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Earn;
