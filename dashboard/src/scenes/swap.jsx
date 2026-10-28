import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { ethers } from "ethers";
import useWallet from "../hooks/useWallet";

const STACH_ADDRESS = process.env.REACT_APP_STACH_ADDRESS || "";

// Base mainnet tokens the scene offers out of the box
const TOKENS = [
  { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
  ...(STACH_ADDRESS
    ? [{ symbol: "STACH", address: STACH_ADDRESS, decimals: 18 }]
    : []),
];

const ERC20_ABI = [
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
];

// External aggregators for the "compare elsewhere" row
const EXTERNAL = (from, to) => [
  { name: "Jumper (LI.FI)", url: `https://jumper.exchange/?fromChain=8453&toChain=8453&fromToken=${from.address}&toToken=${to.address}` },
  { name: "Matcha (0x)", url: `https://matcha.xyz/trade?buyChain=8453&buyAddress=${to.address}&sellChain=8453&sellAddress=${from.address}` },
  { name: "1inch", url: `https://app.1inch.io/swap?src=8453:${from.symbol}&dst=8453:${to.symbol}` },
  { name: "Uniswap", url: `https://app.uniswap.org/swap?chain=base&inputCurrency=${from.address === "0x0000000000000000000000000000000000000000" ? "ETH" : from.address}&outputCurrency=${to.address}` },
];

const Swap = () => {
  const { account, chainId, connect, ensureTargetChain } = useWallet();
  const onBase = chainId === "0x2105";
  const [fromT, setFromT] = useState(TOKENS[0]);
  const [toT, setToT] = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const getQuote = async () => {
    setBusy(true);
    setQuote(null);
    setStatus({ type: "info", msg: "Fetching best route across aggregators…" });
    try {
      const fromAmount = ethers.utils.parseUnits(amount, fromT.decimals).toString();
      const q = new URLSearchParams({
        fromChain: "8453",
        toChain: "8453",
        fromToken: fromT.address,
        toToken: toT.address,
        fromAmount,
        fromAddress: account || "0x0000000000000000000000000000000000000001",
      });
      const res = await fetch(`https://li.quest/v1/quote?${q}`);
      const data = await res.json();
      if (!data.estimate) throw new Error(data.message || "no route found");
      setQuote(data);
      setStatus(null);
    } catch (e) {
      setStatus({ type: "error", msg: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    setBusy(true);
    setStatus({ type: "info", msg: "Executing swap…" });
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // ERC-20 input needs allowance for the aggregator router first
      if (fromT.address !== TOKENS[0].address) {
        const units = ethers.utils.parseUnits(amount, fromT.decimals);
        const erc20 = new ethers.Contract(fromT.address, ERC20_ABI, signer);
        const allowance = await erc20.allowance(account, quote.estimate.approvalAddress);
        if (allowance.lt(units)) {
          const txA = await erc20.approve(quote.estimate.approvalAddress, units);
          await txA.wait();
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
      setStatus({ type: "success", msg: "Swap confirmed" });
      setQuote(null);
    } catch (e) {
      setStatus({ type: "error", msg: e.reason || e.message });
    } finally {
      setBusy(false);
    }
  };

  const flip = () => {
    setFromT(toT);
    setToT(fromT);
    setQuote(null);
  };

  return (
    <Box m="20px">
      <Typography variant="h3" fontWeight="bold" mb={1}>
        Swap
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Routed through swap aggregators over audited DEX liquidity on Base
        (Uniswap, Aerodrome and others) — we run the interface, the aggregator
        finds the best route, your wallet signs. STACH becomes routable once
        its liquidity pool is live.
      </Typography>

      {status && (
        <Alert severity={status.type} sx={{ mb: 2, maxWidth: 640 }} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small" fullWidth label="Amount" value={amount}
                  onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
                />
                <TextField
                  size="small" select value={fromT.symbol} sx={{ minWidth: 110 }}
                  onChange={(e) => { setFromT(TOKENS.find((t) => t.symbol === e.target.value)); setQuote(null); }}
                >
                  {TOKENS.map((t) => (
                    <MenuItem key={t.symbol} value={t.symbol}>{t.symbol}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box display="flex" justifyContent="center" my={0.5}>
                <Button size="small" onClick={flip} startIcon={<SwapVertIcon />}>flip</Button>
              </Box>
              <TextField
                size="small" select fullWidth label="Receive" value={toT.symbol} sx={{ mb: 2 }}
                onChange={(e) => { setToT(TOKENS.find((t) => t.symbol === e.target.value)); setQuote(null); }}
              >
                {TOKENS.map((t) => (
                  <MenuItem key={t.symbol} value={t.symbol}>{t.symbol}</MenuItem>
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
              ) : !quote ? (
                <Button variant="contained" disabled={busy || !amount || fromT.symbol === toT.symbol} onClick={getQuote}>
                  Get quote
                </Button>
              ) : (
                <>
                  <Typography variant="body2" mb={1}>
                    You receive ≈{" "}
                    <b>
                      {Number(
                        ethers.utils.formatUnits(quote.estimate.toAmount, toT.decimals)
                      ).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {toT.symbol}
                    </b>{" "}
                    · route: {quote.tool} · gas ≈ $
                    {quote.estimate.gasCosts?.[0]?.amountUSD || "?"}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button variant="contained" disabled={busy} onClick={execute}>
                      Swap
                    </Button>
                    <Button variant="outlined" disabled={busy} onClick={getQuote}>
                      Refresh quote
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
              <Typography variant="h6" mb={1}>
                Compare on other aggregators
              </Typography>
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
