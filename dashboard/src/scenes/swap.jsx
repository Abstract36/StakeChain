import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Link,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import useWallet from "../hooks/useWallet";
import { ethers } from "ethers";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";
const NATIVE = "0x0000000000000000000000000000000000000000";
const RPC = "https://mainnet.base.org";

const BASE_TOKENS = [
  { symbol: "ETH", address: NATIVE, decimals: 18 },
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
  ...(STACH_ADDRESS ? [{ symbol: "STACH", address: STACH_ADDRESS, decimals: 18 }] : []),
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

const EXTERNAL = (from, to) => [
  { name: "Jumper", url: `https://jumper.exchange/?fromChain=8453&toChain=8453&fromToken=${from.address}&toToken=${to.address}` },
  { name: "Matcha", url: `https://matcha.xyz/trade?buyChain=8453&buyAddress=${to.address}&sellChain=8453&sellAddress=${from.address}` },
  { name: "Uniswap", url: `https://app.uniswap.org/swap?chain=base&inputCurrency=${from.address === NATIVE ? "ETH" : from.address}&outputCurrency=${to.address}` },
];

const fmt = (n, d = 6) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

const Swap = () => {
  const { account, chainId, connect, ensureTargetChain } = useWallet();
  const onBase = chainId === "0x2105";
  const [tokens, setTokens] = useState(BASE_TOKENS);
  const [fromT, setFromT] = useState(BASE_TOKENS[0]);
  const [toT, setToT] = useState(BASE_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState({});
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importAddr, setImportAddr] = useState("");
  const debounceRef = useRef();

  // ----- balances for the pickers -----
  const loadBalances = useCallback(async () => {
    if (!account) return;
    const p = new ethers.providers.JsonRpcProvider(RPC);
    const out = {};
    await Promise.all(
      tokens.map(async (t) => {
        try {
          const bn =
            t.address === NATIVE
              ? await p.getBalance(account)
              : await new ethers.Contract(t.address, ERC20_ABI, p).balanceOf(account);
          out[t.address] = Number(ethers.utils.formatUnits(bn, t.decimals));
        } catch {
          out[t.address] = null;
        }
      })
    );
    setBalances(out);
  }, [account, tokens]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // ----- auto-quote (debounced) -----
  const getQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0 || fromT.address === toT.address) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    try {
      const fromAmount = ethers.utils.parseUnits(amount, fromT.decimals).toString();
      const q = new URLSearchParams({
        fromChain: "8453",
        toChain: "8453",
        fromToken: fromT.address,
        toToken: toT.address,
        fromAmount,
        fromAddress: account || "0x0000000000000000000000000000000000000001",
        slippage: String(slippage / 100),
        integrator: "stakechain",
      });
      const res = await fetch(`https://li.quest/v1/quote?${q}`);
      const data = await res.json();
      if (!data.estimate) throw new Error(data.message || "no route found");
      setQuote({ ...data, at: Date.now() });
      setStatus(null);
    } catch (e) {
      setQuote(null);
      setStatus({ type: "warning", msg: String(e.message || e) });
    } finally {
      setQuoting(false);
    }
  }, [amount, fromT, toT, slippage, account]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceRef.current);
  }, [getQuote]);

  // ----- execute -----
  const execute = async () => {
    setBusy(true);
    setStatus({ type: "info", msg: "Executing swap…" });
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      if (fromT.address !== NATIVE) {
        const units = ethers.utils.parseUnits(amount, fromT.decimals);
        const erc20 = new ethers.Contract(fromT.address, ERC20_ABI, signer);
        const allowance = await erc20.allowance(account, quote.estimate.approvalAddress);
        if (allowance.lt(units)) {
          setStatus({ type: "info", msg: "Approving token…" });
          await (await erc20.approve(quote.estimate.approvalAddress, units)).wait();
          setStatus({ type: "info", msg: "Swapping…" });
        }
      }
      const tr = quote.transactionRequest;
      const tx = await signer.sendTransaction({
        to: tr.to,
        data: tr.data,
        value: tr.value || 0,
        gasLimit: tr.gasLimit,
      });
      await tx.wait();
      setStatus({
        type: "success",
        msg: "Swap confirmed",
        link: `https://base.blockscout.com/tx/${tx.hash}`,
      });
      setQuote(null);
      setAmount("");
      loadBalances();
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message });
    } finally {
      setBusy(false);
    }
  };

  // ----- import custom token -----
  const importToken = async () => {
    try {
      const addr = ethers.utils.getAddress(importAddr.trim());
      if (tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())) return;
      const p = new ethers.providers.JsonRpcProvider(RPC);
      const c = new ethers.Contract(addr, ERC20_ABI, p);
      const [symbol, decimals] = await Promise.all([c.symbol(), c.decimals()]);
      const t = { symbol, address: addr, decimals };
      setTokens((prev) => [...prev, t]);
      setToT(t);
      setImportAddr("");
      setStatus({ type: "success", msg: `${symbol} imported` });
    } catch (e) {
      setStatus({ type: "error", msg: `import failed: ${String(e.message).slice(0, 80)}` });
    }
  };

  const flip = () => {
    setFromT(toT);
    setToT(fromT);
    setQuote(null);
  };

  const receiveAmount = quote
    ? Number(ethers.utils.formatUnits(quote.estimate.toAmount, toT.decimals))
    : null;
  const minReceived = quote?.estimate.toAmountMin
    ? Number(ethers.utils.formatUnits(quote.estimate.toAmountMin, toT.decimals))
    : null;
  const rate =
    quote && Number(amount) > 0 ? receiveAmount / Number(amount) : null;
  const balFrom = balances[fromT.address];

  const tokenSelect = (value, setValue) => (
    <TextField
      size="small" select value={value.symbol} sx={{ minWidth: 118 }}
      onChange={(e) => {
        setValue(tokens.find((t) => t.symbol === e.target.value));
        setQuote(null);
      }}
    >
      {tokens.map((t) => (
        <MenuItem key={t.address} value={t.symbol}>
          {t.symbol}
          {balances[t.address] != null && (
            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
              {fmt(balances[t.address], 4)}
            </Typography>
          )}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Swap
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Best route across Base DEX liquidity via aggregators — our interface,
        audited venues, your signature. STACH is live and routable.
      </Typography>

      {status && (
        <Alert severity={status.type} sx={{ mb: 2, maxWidth: 640 }} onClose={() => setStatus(null)}>
          {status.msg}
          {status.link && (
            <>
              {" · "}
              <Link href={status.link} target="_blank" rel="noreferrer">
                view transaction ↗
              </Link>
            </>
          )}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {/* pay */}
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">You pay</Typography>
                {account && balFrom != null && (
                  <Typography variant="caption" color="text.secondary">
                    balance: {fmt(balFrom, 4)}{" "}
                    <Link
                      component="button"
                      onClick={() =>
                        setAmount(
                          String(
                            fromT.address === NATIVE
                              ? Math.max(balFrom - 0.0003, 0) // leave gas
                              : balFrom
                          )
                        )
                      }
                    >
                      MAX
                    </Link>
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small" fullWidth placeholder="0.0" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {tokenSelect(fromT, setFromT)}
              </Box>

              <Box display="flex" justifyContent="center" my={0.5}>
                <IconButton size="small" onClick={flip}>
                  <SwapVertIcon />
                </IconButton>
              </Box>

              {/* receive */}
              <Typography variant="caption" color="text.secondary">You receive (est.)</Typography>
              <Box display="flex" gap={1} mb={1.5} mt={0.5}>
                <TextField
                  size="small" fullWidth placeholder="0.0"
                  value={receiveAmount != null ? fmt(receiveAmount) : ""}
                  InputProps={{ readOnly: true }}
                />
                {tokenSelect(toT, setToT)}
              </Box>

              {/* slippage */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <Typography variant="caption" color="text.secondary">Slippage:</Typography>
                {[0.5, 1, 3].map((s) => (
                  <Chip
                    key={s} size="small" label={`${s}%`}
                    color={slippage === s ? "primary" : "default"}
                    onClick={() => setSlippage(s)}
                  />
                ))}
              </Box>

              {/* quote details */}
              {quoting ? (
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">finding best route…</Typography>
                </Box>
              ) : quote ? (
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  1 {fromT.symbol} ≈ {fmt(rate)} {toT.symbol} · min received{" "}
                  {fmt(minReceived)} {toT.symbol} · route {quote.tool} · gas ≈ $
                  {quote.estimate.gasCosts?.[0]?.amountUSD || "?"}
                </Typography>
              ) : null}

              {!account ? (
                <Button fullWidth variant="contained" onClick={() => connect({ ensureChain: true }).catch(() => {})} disabled={!window.ethereum}>
                  {window.ethereum ? "Connect wallet" : "No wallet detected"}
                </Button>
              ) : !onBase ? (
                <Button fullWidth variant="contained" color="warning" onClick={() => ensureTargetChain().catch(() => {})}>
                  Switch to Base
                </Button>
              ) : (
                <Button
                  fullWidth variant="contained" disabled={busy || !quote || quoting}
                  onClick={execute}
                >
                  {busy ? "Confirm in wallet…" : quote ? "Swap" : "Enter an amount"}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" mb={1}>Import token</Typography>
              <Box display="flex" gap={1}>
                <TextField
                  size="small" fullWidth placeholder="0x… token address"
                  value={importAddr} onChange={(e) => setImportAddr(e.target.value)}
                />
                <Button variant="outlined" onClick={importToken} disabled={!importAddr}>
                  Add
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Compare elsewhere</Typography>
              {EXTERNAL(fromT, toT).map((a) => (
                <Typography key={a.name} variant="body2" mb={0.5}>
                  <Link href={a.url} target="_blank" rel="noreferrer">
                    {a.name} ↗
                  </Link>
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Swap;
