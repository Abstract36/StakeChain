import React, { useState } from "react";
import {
  Box,
  IconButton,
  useTheme,
} from "@mui/material";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import WavesIcon from "@mui/icons-material/Waves";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import styles from '../../scenes/global/sidebar.module.css'; // Import the CSS module

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [setSelected] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { title: "Base Yields", to: "/", icon: <StackedLineChartIcon /> },
    { title: "STACH Staking", to: "/staking", icon: <AddReactionIcon /> },
    { title: "Pools", to: "/pools", icon: <WavesIcon /> },
    { title: "Analytics", to: "/analytics", icon: <MapOutlinedIcon /> },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

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
                {collapsed ? (
                  <IconButton onClick={toggleSidebar}>
                    <MenuOutlinedIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={toggleSidebar} style={{ marginLeft: "10px" }}>
                    <MenuOutlinedIcon />
                  </IconButton>
                )}
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
                  alt="logo"
                  width="170px"
                  height="95px"
                  src={`../../assets/logo.png`}
                  style={{ cursor: "pointer" }}
                />
              </Box>
              <Box textAlign="center">
                <div className={styles.subtitle}>Explore DeFi</div>
                <div className={styles.title}>
                  StakeChain Portfolio Manager
                </div>
              </Box>
            </Box>
          )}

          <Box ml={collapsed ? "3px" : "15px"}>
            {menuItems.map((item) => (
              <MenuItem
                key={item.title}
                className={styles.menuItem}
              >
                <Link
                  to={item.to}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    color: "inherit",
                  }}
                  onClick={() => setSelected(item.title)}
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
