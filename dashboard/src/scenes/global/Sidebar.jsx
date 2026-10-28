import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import WavesIcon from "@mui/icons-material/Waves";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import styles from "../../scenes/global/sidebar.module.css";

const menuItems = [
  { title: "Base Yields", to: "/", icon: <StackedLineChartIcon /> },
  { title: "STACH Staking", to: "/staking", icon: <AddReactionIcon /> },
  { title: "Pools", to: "/pools", icon: <WavesIcon /> },
  { title: "Analytics", to: "/analytics", icon: <MapOutlinedIcon /> },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  // active item follows the route, no manual selection state needed
  const { pathname } = useLocation();

  const isActive = (to) =>
    to === "/" ? pathname === "/" || pathname === "/yields" : pathname.startsWith(to);

  return (
    <Box>
      <ProSidebar collapsed={collapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              className={collapsed ? styles.collapsedMenuItem : styles.menuItem}
            >
              <div>
                <IconButton
                  onClick={() => setCollapsed(!collapsed)}
                  style={collapsed ? undefined : { marginLeft: "10px" }}
                >
                  <MenuOutlinedIcon />
                </IconButton>
              </div>
              <div className={collapsed ? styles.collapsedText : styles.menuText}>
                Main Menu
              </div>
            </Box>
          </MenuItem>

          {!collapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="StakeChain logo"
                  width="170px"
                  height="95px"
                  src={`${process.env.PUBLIC_URL}/assets/logo.png`}
                />
              </Box>
              <Box textAlign="center">
                <div className={styles.subtitle}>StakeChain Labs</div>
                <div className={styles.title}>Base yields experiment</div>
              </Box>
            </Box>
          )}

          <Box ml={collapsed ? "3px" : "15px"}>
            {menuItems.map((item) => (
              <MenuItem
                key={item.title}
                active={isActive(item.to)}
                className={styles.menuItem}
              >
                <Link
                  to={item.to}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    color: "inherit",
                    fontWeight: isActive(item.to) ? 700 : 400,
                  }}
                >
                  {item.icon}
                  <div className={styles.menuText}>{item.title}</div>
                </Link>
              </MenuItem>
            ))}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
