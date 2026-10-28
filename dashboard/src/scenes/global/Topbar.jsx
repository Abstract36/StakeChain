import React, { useContext, useEffect, useState } from "react";
import { Box, Button, Chip, IconButton, Typography, useTheme } from "@mui/material";
import { ColorModeContext } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import styles from "../../scenes/global/topbar.module.css";

const CHAIN_NAMES = {
  "0x14a34": "Base Sepolia",
  "0x2105": "Base",
  "0x1": "Ethereum",
};

const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    // pick up an already-authorized session without prompting
    eth.request({ method: "eth_accounts" }).then((a) => setAccount(a[0] || null)).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(setChainId).catch(() => {});

    const onAccounts = (a) => setAccount(a[0] || null);
    const onChain = (c) => setChainId(c);
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = async () => {
    try {
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr || null);
      const c = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(c);
    } catch {
      /* user rejected */
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
      className={styles.topbar}
    >
      <Typography variant="h5" fontWeight="bold">
        StakeChain{" "}
        <Typography component="span" variant="h5" color="text.secondary">
          / Base yields experiment
        </Typography>
      </Typography>

      <Box display="flex" alignItems="center" gap={1}>
        <IconButton onClick={colorMode.toggleColorMode} aria-label="Toggle color mode">
          {theme.palette.mode === "dark" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
        </IconButton>

        {account ? (
          <>
            {chainId && (
              <Chip
                size="small"
                color={chainId === "0x14a34" ? "success" : "default"}
                label={CHAIN_NAMES[chainId] || `chain ${parseInt(chainId, 16)}`}
              />
            )}
            <Chip
              icon={<AccountBalanceWalletOutlinedIcon />}
              label={short(account)}
              variant="outlined"
            />
          </>
        ) : (
          <Button
            variant="contained"
            onClick={connect}
            disabled={!window.ethereum}
            startIcon={<AccountBalanceWalletOutlinedIcon />}
          >
            {window.ethereum ? "Connect" : "No wallet"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Topbar;
