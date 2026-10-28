import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  "function maxWithdraw(address owner) view returns (uint256)",
];

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
      .then((d) => setVaults(d.vaults))
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
    const vault = new ethers.Contract(selected.address, VAULT_ABI, p);
    const [walletBal, deposited] = await Promise.all([
      asset.balanceOf(account),
      vault.maxWithdraw(account),
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
      const allowance = await asset.allowance(account, selected.address);
      if (allowance.lt(units)) {
        const txA = await asset.approve(selected.address, units);
        await txA.wait();
      }
      const vault = new ethers.Contract(selected.address, VAULT_ABI, signer);
      const tx = await vault.deposit(units, account);
      await tx.wait();
    });

  const withdraw = () =>
    run("Withdraw", async () => {
      const signer = provider().getSigner();
      const units = ethers.utils.parseUnits(amount, selected.asset.decimals);
      const vault = new ethers.Contract(selected.address, VAULT_ABI, signer);
      const tx = await vault.withdraw(units, account, account);
      await tx.wait();
    });

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Earn — lend on Base
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Lend assets to borrowers through audited Morpho vaults (ERC-4626) and
        earn the rates below. Borrowers post collateral and are liquidated by
        the Morpho protocol — your deposit goes to the vault contract, never
        through us. This is an interface, not custody.
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
                    <TableCell>Vault</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">APY</TableCell>
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
                      <TableCell>{v.asset.symbol}</TableCell>
                      <TableCell align="right">
                        <Typography component="span" fontWeight="bold" color="success.main">
                          {v.apy}%
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
                          Wallet: {fmtAsset(pos?.walletBal)} {selected.asset.symbol}
                        </Typography>
                        <Typography variant="body2" mb={2}>
                          Deposited: {fmtAsset(pos?.deposited)} {selected.asset.symbol}
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
                          <Button variant="contained" disabled={busy || !amount} onClick={deposit}>
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
