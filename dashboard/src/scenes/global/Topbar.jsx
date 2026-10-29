import React, { useContext, useState } from "react";
import { Box, Button, Chip, IconButton, Menu, MenuItem, Typography, useTheme } from "@mui/material";
import { ColorModeContext } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import useWallet, { TARGET_CHAIN_ID } from "../../hooks/useWallet";
import styles from "../../scenes/global/topbar.module.css";

const CHAIN_NAMES = {
  "0x14a34": "Base Sepolia",
  "0x2105": "Base",
  "0x1": "Ethereum",
};

const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// Mobile browsers have no injected provider; deep links reopen the dapp
// inside a wallet's built-in browser, where window.ethereum exists.
const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent || "");
const metamaskLink = () =>
  `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
const coinbaseLink = () =>
  `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { account, chainId, connect } = useWallet();
  const [walletMenuEl, setWalletMenuEl] = useState(null);

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
        <Typography component="span" variant="h5" color="text.secondary" className={styles.tagline}>
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
                color={chainId === TARGET_CHAIN_ID ? "success" : "default"}
                label={CHAIN_NAMES[chainId] || `chain ${parseInt(chainId, 16)}`}
              />
            )}
            <Chip
              icon={<AccountBalanceWalletOutlinedIcon />}
              label={short(account)}
              variant="outlined"
            />
          </>
        ) : window.ethereum ? (
          <Button
            variant="contained"
            onClick={() => connect().catch(() => {})}
            startIcon={<AccountBalanceWalletOutlinedIcon />}
          >
            Connect
          </Button>
        ) : isMobile ? (
          <>
            <Button
              variant="contained"
              onClick={(e) => setWalletMenuEl(e.currentTarget)}
              startIcon={<AccountBalanceWalletOutlinedIcon />}
            >
              Connect
            </Button>
            <Menu
              anchorEl={walletMenuEl}
              open={Boolean(walletMenuEl)}
              onClose={() => setWalletMenuEl(null)}
            >
              <MenuItem component="a" href={metamaskLink()}>
                Open in MetaMask
              </MenuItem>
              <MenuItem component="a" href={coinbaseLink()}>
                Open in Coinbase Wallet
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button variant="contained" disabled startIcon={<AccountBalanceWalletOutlinedIcon />}>
            No wallet
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Topbar;
