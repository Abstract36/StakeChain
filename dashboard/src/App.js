import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Footer from "./scenes/global/footer";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Analytics from "./scenes/analytics";
import Bridge from "./scenes/bridge";
import Swap from "./scenes/swap";
import Cryptobuy from "./scenes/cryptobuy";
import Pools from "./scenes/pools";
import Trade from "./scenes/trading";
import Staking from "./scenes/staking";
import Lending from "./scenes/lending";
import Insurance from "./scenes/insurance";
import Recovery from "./scenes/recovery";
import HistoryTrans from "./scenes/history";
import DepositCrypto from "./scenes/deposit";
import SendCryptocurrency from "./scenes/send";
import EscrowService from "./scenes/escrow";
import NotificationService from "./scenes/notification";
import MyEarningsNotes from "./scenes/myearnings";
import '@fontsource/roboto/300.css';
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  safeWallet,
  embeddedWallet,
  localWallet,
  rainbowWallet,
  zerionWallet,
  bloctoWallet,
  frameWallet,
  phantomWallet,
  okxWallet,
} from "@thirdweb-dev/react";
import { WifiTetheringErrorRoundedSharp } from "@mui/icons-material";


function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ThirdwebProvider clientId="480d1b8b6e5ebef764d8fc4f8b3e3429"
      authConfig={{
        // Set this to your domain to prevent phishing attacks
        domain: "example.com",
        // The URL of your Auth API
        authUrl: "/api/auth", //Add API AUTH 
      }}
      supportedWallets={[
        metamaskWallet(),
        walletConnect(),
        coinbaseWallet(),
        safeWallet(),
        embeddedWallet(),
        localWallet(),
        rainbowWallet(),
        zerionWallet(),
        bloctoWallet(),
        frameWallet(),
        phantomWallet(),
        okxWallet(),
      ]}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>

          <CssBaseline />
          <div className="app">
            <Sidebar isSidebar={isSidebar} />
            <main className="content">
              <Topbar setIsSidebar={setIsSidebar} />
              <Routes>
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/cryptobuy" element={<Cryptobuy />} />
                <Route path="/pools" element={<Pools />} />
                <Route path="/trading" element={<Trade />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/lending" element={<Lending />} />
                <Route path="/insurance" element={<Insurance />} />
                <Route path="/recovery" element={<Recovery />} />
                <Route path="/history" element={<HistoryTrans />} />
                <Route path="/deposit" element={<DepositCrypto />} />
                <Route path="/send" element={<SendCryptocurrency />} />
                <Route path="/escrow" element={<EscrowService />} />
                <Route path="/notification" element={<NotificationService />} />
                <Route path="/myearnings" element={<MyEarningsNotes />} />
              </Routes>
              <Footer /> {/* Include the Footer component */}
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </ThirdwebProvider>
  );
}

export default App;

