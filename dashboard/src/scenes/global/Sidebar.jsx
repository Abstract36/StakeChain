import React, { useEffect, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import SwapCallsIcon from "@mui/icons-material/SwapCalls";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import WavesIcon from "@mui/icons-material/Waves";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import styles from "../../scenes/global/sidebar.module.css";

const menuItems = [
  { title: "Base Yields", to: "/", icon: <StackedLineChartIcon /> },
  { title: "Swap", to: "/swap", icon: <SwapCallsIcon /> },
  { title: "Earn", to: "/earn", icon: <SavingsOutlinedIcon /> },
  { title: "Borrow", to: "/borrow", icon: <AccountBalanceOutlinedIcon /> },
  { title: "STACH Staking", to: "/staking", icon: <AddReactionIcon /> },
  { title: "Pools", to: "/pools", icon: <WavesIcon /> },
  { title: "Portfolio", to: "/analytics", icon: <PersonOutlinedIcon /> },
];

const Sidebar = () => {
  // default collapsed on narrow screens
  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined" && window.innerWidth < 900
  );
  const { pathname } = useLocation();

  useEffect(() => {
    const onResize = () => window.innerWidth < 900 && setCollapsed(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isActive = (to) =>
    to === "/"
      ? pathname === "/" || pathname === "/yields"
      : pathname.startsWith(to);

  return (
    <nav className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <IconButton onClick={() => setCollapsed(!collapsed)} aria-label="Toggle menu">
          <MenuOutlinedIcon />
        </IconButton>
        {!collapsed && <span className={styles.headerText}>Menu</span>}
      </div>

      {!collapsed && (
        <Box textAlign="center" mb={2}>
          <img
            alt="StakeChain logo"
            width="110"
            style={{ borderRadius: "10px", margin: "6px 0" }}
            src={`${process.env.PUBLIC_URL}/assets/logo.png`}
          />
          <div className={styles.subtitle}>StakeChain Labs</div>
          <div className={styles.title}>Base yields experiment</div>
        </Box>
      )}

      <div className={styles.items}>
        {menuItems.map((item) => {
          const link = (
            <Link
              key={item.title}
              to={item.to}
              className={`${styles.item} ${isActive(item.to) ? styles.active : ""}`}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.title} title={item.title} placement="right">
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
