import React, { useContext } from "react";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { ColorModeContext } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { ConnectWallet } from "@thirdweb-dev/react";
import styles from "../../scenes/global/topbar.module.css";

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

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
        <IconButton
          onClick={colorMode.toggleColorMode}
          aria-label="Toggle color mode"
        >
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <ConnectWallet modalSize="compact" btnTitle="Connect" />
      </Box>
    </Box>
  );
};

export default Topbar;
