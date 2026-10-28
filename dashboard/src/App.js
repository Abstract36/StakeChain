import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Footer from "./scenes/global/footer";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Yields from "./scenes/yields";
import Earn from "./scenes/earn";
import Pools from "./scenes/pools";
import Staking from "./scenes/staking";
import Analytics from "./scenes/analytics";
import "@fontsource/roboto/300.css";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
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
              <Route path="/earn" element={<Earn />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
            <Footer />
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
