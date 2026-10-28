import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Footer from "./scenes/global/footer";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Yields from "./scenes/yields";
import Pools from "./scenes/pools";
import Staking from "./scenes/staking";
import Analytics from "./scenes/analytics";
import "@fontsource/roboto/300.css";
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
} from "@thirdweb-dev/react";
import { Base, BaseSepoliaTestnet } from "@thirdweb-dev/chains";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ThirdwebProvider
      clientId={process.env.REACT_APP_THIRDWEB_CLIENT_ID}
      activeChain={BaseSepoliaTestnet}
      supportedChains={[BaseSepoliaTestnet, Base]}
      supportedWallets={[metamaskWallet(), coinbaseWallet(), walletConnect()]}
    >
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            <Sidebar isSidebar={isSidebar} />
            <main className="content">
              <Topbar setIsSidebar={setIsSidebar} />
              <Routes>
                <Route path="/" element={<Yields />} />
                <Route path="/yields" element={<Yields />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/pools" element={<Pools />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
              <Footer />
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </ThirdwebProvider>
  );
}

export default App;
