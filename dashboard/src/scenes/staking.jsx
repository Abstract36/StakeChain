import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { ethers } from "ethers";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";

const STACH_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function rewards(address) view returns (uint256)",
  "function flexibleStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "function lockedStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "function stakeInFlexible(uint256 amount)",
  "function stakeInLocked(uint256 amount, uint256 numOfMonths)",
  "function unstakeFlexible(uint256 depositId, uint256 amount)",
  "function unstakeLocked(uint256 depositId)",
  "function processRewards()",
  "function withdrawRewards() returns (uint256)",
];

const fmt = (bn) =>
  bn ? Number(ethers.utils.formatEther(bn)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0";

const Staking = () => {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({});
  const [flexAmount, setFlexAmount] = useState("");
  const [lockAmount, setLockAmount] = useState("");
  const [lockMonths, setLockMonths] = useState(6);

  const getContract = useCallback((withSigner) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return new ethers.Contract(
      STACH_ADDRESS,
      STACH_ABI,
      withSigner ? provider.getSigner() : provider
    );
  }, []);

  const refresh = useCallback(async (addr) => {
    const c = getContract(false);
    const [balance, pending, flex, locked] = await Promise.all([
      c.balanceOf(addr),
      c.rewards(addr),
      c.flexibleStakingUsers(addr),
      c.lockedStakingUsers(addr),
    ]);
    setData({
      balance,
      pending,
      flexStaked: flex.tokenAmount,
      lockedStaked: locked.tokenAmount,
    });
  }, [getContract]);

  const connect = async () => {
    try {
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr);
      await refresh(addr);
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
  };

  useEffect(() => {
    if (account) refresh(account).catch(() => {});
  }, [account, refresh]);

  const run = async (label, fn) => {
    setBusy(true);
    setStatus({ type: "info", msg: `${label}…` });
    try {
      const tx = await fn(getContract(true));
      await tx.wait();
      setStatus({ type: "success", msg: `${label}: confirmed` });
      await refresh(account);
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message });
    } finally {
      setBusy(false);
    }
  };

  if (!STACH_ADDRESS) {
    return (
      <Box m="20px">
        <Typography variant="h3" fontWeight="bold" mb={2}>
          STACH Staking
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 640 }}>
          The STACH contract is not deployed yet. It ships with the Base
          Sepolia launch — set <code>REACT_APP_STACH_ADDRESS</code> in{" "}
          <code>.env</code> once deployed. The contract is audited and covered
          by 25 tests; see <code>docs/AUDIT-2026-10.md</code> in the repo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        STACH Staking
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Flexible pool: stake/unstake any time, 1M STACH over 360 days. Locked
        pool: 1–6 month locks, time-weighted share of 2M STACH.
      </Typography>

      {status && (
        <Alert severity={status.type} sx={{ mb: 2, maxWidth: 720 }} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      {!account ? (
        <Button variant="contained" onClick={connect} disabled={!window.ethereum}>
          {window.ethereum ? "Connect wallet" : "No wallet detected"}
        </Button>
      ) : (
        <>
          <Grid container spacing={2} mb={2}>
            {[
              ["Wallet balance", fmt(data.balance)],
              ["Staked (flexible)", fmt(data.flexStaked)],
              ["Staked (locked)", fmt(data.lockedStaked)],
              ["Pending rewards", fmt(data.pending)],
            ].map(([label, value]) => (
              <Grid item xs={6} md={3} key={label}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {value} STACH
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Flexible pool</Typography>
                  <TextField
                    size="small" fullWidth label="Amount (STACH)" value={flexAmount}
                    onChange={(e) => setFlexAmount(e.target.value)} sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained" disabled={busy || !flexAmount}
                    onClick={() =>
                      run("Stake (flexible)", (c) =>
                        c.stakeInFlexible(ethers.utils.parseEther(flexAmount))
                      )
                    }
                  >
                    Stake
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Locked pool</Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      size="small" fullWidth label="Amount (STACH)" value={lockAmount}
                      onChange={(e) => setLockAmount(e.target.value)}
                    />
                    <TextField
                      size="small" select label="Months" value={lockMonths}
                      onChange={(e) => setLockMonths(Number(e.target.value))}
                      sx={{ minWidth: 100 }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Button
                    variant="contained" disabled={busy || !lockAmount}
                    onClick={() =>
                      run("Stake (locked)", (c) =>
                        c.stakeInLocked(ethers.utils.parseEther(lockAmount), lockMonths)
                      )
                    }
                  >
                    Stake locked
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Rewards</Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined" disabled={busy}
                      onClick={() => run("Process rewards", (c) => c.processRewards())}
                    >
                      Process rewards
                    </Button>
                    <Button
                      variant="contained" disabled={busy}
                      onClick={() => run("Withdraw rewards", (c) => c.withdrawRewards())}
                    >
                      Withdraw rewards
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Staking;
