import React, { useContext } from "react";
import { Box, Button, Chip, IconButton, Typography, useTheme } from "@mui/material";
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

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { account, chainId, connect } = useWallet();

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
        ) : (
          <Button
            variant="contained"
            onClick={() => connect().catch(() => {})}
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
