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
import useWallet, { TARGET_CHAIN_ID } from "../hooks/useWallet";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";
const FAUCET_ADDRESS = process.env.REACT_APP_FAUCET_ADDRESS || "";

// storage slots of the user mappings (verified against live mainnet state;
// ReentrancyGuard occupies slot 0, see docs/AUDIT-2026-10.md layout note)
const SLOT_LOCKED_USERS = 18;
const SLOT_FLEX_USERS = 19;

const STACH_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function rewards(address) view returns (uint256)",
  "function flexibleStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "function lockedStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
  "function flexiblePool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function lockedPool() view returns (uint256 totalLockedWeight, uint256 yieldRewardsPerWeight, uint256 lastUpdatedTime, uint256 rewardsRate)",
  "function periodFinish() view returns (uint256)",
  "function stakeInFlexible(uint256 amount)",
  "function stakeInLocked(uint256 amount, uint256 numOfMonths)",
  "function unstakeFlexible(uint256 depositId, uint256 amount)",
  "function unstakeLocked(uint256 depositId)",
  "function processRewards()",
  "function withdrawRewards() returns (uint256)",
];

const fmt2 = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

const fmt = (bn) =>
  bn ? Number(ethers.utils.formatEther(bn)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0";

const Staking = () => {
  const { account, chainId, connect: walletConnect, ensureTargetChain } = useWallet();
  const onTargetChain = chainId === TARGET_CHAIN_ID;
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({});
  const [deposits, setDeposits] = useState({ flex: [], locked: [] });
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
    const [balance, pending, flex, locked, flexPool, lockPool, finish] =
      await Promise.all([
        c.balanceOf(addr),
        c.rewards(addr),
        c.flexibleStakingUsers(addr),
        c.lockedStakingUsers(addr),
        c.flexiblePool(),
        c.lockedPool(),
        c.periodFinish(),
      ]);
    setData({
      balance,
      pending,
      flexStaked: flex.tokenAmount,
      lockedStaked: locked.tokenAmount,
      // raw snapshot for the live per-second reward ticker
      snap: { flex, locked, flexPool, lockPool, finish: Number(finish) },
    });

    // Read the internal deposits arrays straight from storage: the contract
    // exposes no getter, but slots are deterministic and deletes never shift
    // indices — so these are exact amounts, dates and IDs.
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const coder = ethers.utils.defaultAbiCoder;
    const readSlot = (s) => provider.getStorageAt(STACH_ADDRESS, s);
    const loadPool = async (mapSlot) => {
      const base = ethers.BigNumber.from(
        ethers.utils.keccak256(coder.encode(["address", "uint256"], [addr, mapSlot]))
      );
      const lenSlot = ethers.utils.hexZeroPad(base.add(3).toHexString(), 32);
      const len = ethers.BigNumber.from(await readSlot(lenSlot)).toNumber();
      const elemBase = ethers.BigNumber.from(ethers.utils.keccak256(lenSlot));
      const list = [];
      for (let i = 0; i < len; i++) {
        const at = (o) => readSlot(elemBase.add(i * 4 + o).toHexString());
        const [amountBn, lockedFrom, lockedUntil] = (
          await Promise.all([at(0), at(2), at(3)])
        ).map((v) => ethers.BigNumber.from(v));
        if (amountBn.isZero()) continue; // withdrawn slot
        list.push({
          id: i,
          amountBn,
          amount: Number(ethers.utils.formatEther(amountBn)),
          stakedAt: lockedFrom.isZero() ? null : lockedFrom.toNumber(),
          unlockAt: lockedUntil.isZero() ? null : lockedUntil.toNumber(),
        });
      }
      return list;
    };
    const [lockedList, flexList] = await Promise.all([
      loadPool(SLOT_LOCKED_USERS),
      loadPool(SLOT_FLEX_USERS),
    ]);
    setDeposits({ flex: flexList, locked: lockedList });
  }, [getContract]);

  const connect = async () => {
    try {
      await walletConnect({ ensureChain: true });
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
  };

  // one-click token import instead of pasting the address by hand
  const addTokenToWallet = async () => {
    try {
      await ensureTargetChain();
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: STACH_ADDRESS,
            symbol: "STACH",
            decimals: 18,
          },
        },
      });
      setStatus({ type: "success", msg: "STACH added to your wallet" });
    } catch (e) {
      setStatus({ type: "error", msg: e.message });
    }
  };

  // reads only make sense on the contract's chain
  useEffect(() => {
    if (account && onTargetChain) refresh(account).catch(() => {});
  }, [account, onTargetChain, refresh]);

  // live ticker: re-render every second; pending is extrapolated locally
  // with the contract's exact accumulator math, no extra RPC calls
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const livePending = () => {
    const s = data.snap;
    if (!s) return { total: data.pending, perDay: 0 };
    const E12 = ethers.BigNumber.from("1000000000000");
    const now = Math.min(Math.floor(Date.now() / 1000), s.finish);
    let total = data.pending || ethers.BigNumber.from(0);
    let perSec = 0;
    for (const [user, pool] of [
      [s.flex, s.flexPool],
      [s.locked, s.lockPool],
    ]) {
      if (user.totalWeight.isZero()) continue;
      const dt = Math.max(now - Number(pool.lastUpdatedTime), 0);
      // yieldRewardsPerWeight now = stored + rate*dt*1e12/totalWeight
      const yrpwNow = pool.yieldRewardsPerWeight.add(
        pool.rewardsRate.mul(dt).mul(E12).div(pool.totalLockedWeight)
      );
      const accrued = user.totalWeight.mul(yrpwNow).div(E12).sub(user.subYieldRewards);
      if (accrued.gt(0)) total = total.add(accrued);
      perSec +=
        (Number(ethers.utils.formatEther(user.totalWeight)) /
          Number(ethers.utils.formatEther(pool.totalLockedWeight))) *
        Number(ethers.utils.formatEther(pool.rewardsRate));
    }
    return { total, perDay: perSec * 86400 };
  };

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

      <Box display="flex" gap={1} mb={2}>
        {!account && (
          <Button variant="contained" onClick={connect} disabled={!window.ethereum}>
            {window.ethereum ? "Connect wallet" : "No wallet detected"}
          </Button>
        )}
        {account && !onTargetChain && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => ensureTargetChain().catch((e) => setStatus({ type: "error", msg: e.message }))}
          >
            Switch network
          </Button>
        )}
        <Button variant="outlined" onClick={addTokenToWallet} disabled={!window.ethereum}>
          Add STACH to MetaMask
        </Button>
        {FAUCET_ADDRESS && process.env.REACT_APP_CHAIN === "baseSepolia" && account && onTargetChain && (
          <Button
            variant="outlined"
            color="success"
            disabled={busy}
            onClick={() =>
              run("Faucet drip", (c) => {
                const f = new ethers.Contract(
                  FAUCET_ADDRESS,
                  ["function drip()"],
                  new ethers.providers.Web3Provider(window.ethereum).getSigner()
                );
                return f.drip();
              })
            }
          >
            Get 100 test STACH
          </Button>
        )}
        {process.env.REACT_APP_CHAIN === "base" && (
          <Button
            variant="outlined"
            href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${STACH_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            Buy STACH
          </Button>
        )}
      </Box>

      {account && onTargetChain && (
        <>
          <Grid container spacing={2} mb={2}>
            {(() => {
              const lp = livePending();
              const liveStr = lp.total
                ? Number(ethers.utils.formatEther(lp.total)).toLocaleString(undefined, {
                    minimumFractionDigits: 6,
                    maximumFractionDigits: 6,
                  })
                : "0";
              return [
                ["Wallet balance", fmt(data.balance), null],
                ["Staked (flexible)", fmt(data.flexStaked), null],
                ["Staked (locked)", fmt(data.lockedStaked), null],
                [
                  "Pending rewards · live",
                  liveStr,
                  lp.perDay > 0 ? `+${fmt2(lp.perDay)} STACH / day` : null,
                ],
              ].map(([label, value, caption]) => (
                <Grid item xs={6} md={3} key={label}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {value} STACH
                      </Typography>
                      {caption && (
                        <Typography variant="caption" color="success.main">
                          {caption}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ));
            })()}
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

            {(deposits.flex.length > 0 || deposits.locked.length > 0) && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Your deposits</Typography>
                    {[
                      ...deposits.flex.map((d) => ({ ...d, pool: "flex" })),
                      ...deposits.locked.map((d) => ({ ...d, pool: "locked" })),
                    ].map((d) => {
                      const unlocked = !d.unlockAt || d.unlockAt * 1000 <= Date.now();
                      return (
                        <Box
                          key={`${d.pool}-${d.id}`}
                          display="flex" alignItems="center" justifyContent="space-between"
                          flexWrap="wrap" gap={1} py={1}
                          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                        >
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {d.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} STACH
                              <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                                {d.pool === "flex" ? "flexible" : "locked"}
                                {d.stakedAt
                                  ? ` · staked ${new Date(d.stakedAt * 1000).toLocaleDateString()}`
                                  : ""}
                              </Typography>
                            </Typography>
                            {d.unlockAt && (
                              <Typography variant="body2" color={unlocked ? "success.main" : "text.secondary"}>
                                {unlocked
                                  ? "unlocked — ready to withdraw"
                                  : `unlocks ${new Date(d.unlockAt * 1000).toLocaleString()}`}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small" variant="outlined"
                            disabled={busy || !unlocked}
                            onClick={() =>
                              run(
                                "Unstake",
                                (c) =>
                                  d.pool === "flex"
                                    ? c.unstakeFlexible(d.id, d.amountBn)
                                    : c.unstakeLocked(d.id)
                              )
                            }
                          >
                            Unstake
                          </Button>
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>
            )}

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
