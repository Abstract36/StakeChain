import React, { useState } from "react";
import { Box } from "@mui/material";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { useLocation, useNavigate } from "react-router-dom";
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
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (to) =>
    to === "/"
      ? pathname === "/" || pathname === "/yields"
      : pathname.startsWith(to);

  return (
    <Box>
      <ProSidebar collapsed={collapsed} width="240px" collapsedWidth="68px">
        <Menu iconShape="square">
          {/* Collapse toggle: the icon prop stays visible in collapsed mode */}
          <MenuItem
            onClick={() => setCollapsed(!collapsed)}
            icon={<MenuOutlinedIcon />}
            style={{ margin: "6px 0 10px 0" }}
          >
            {!collapsed && <span className={styles.menuText}>Main Menu</span>}
          </MenuItem>

          {!collapsed && (
            <Box mb="20px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="StakeChain logo"
                  width="120"
                  style={{ borderRadius: "10px", margin: "8px 0" }}
                  src={`${process.env.PUBLIC_URL}/assets/logo.png`}
                />
              </Box>
              <Box textAlign="center">
                <div className={styles.subtitle}>StakeChain Labs</div>
                <div className={styles.title}>Base yields experiment</div>
              </Box>
            </Box>
          )}

          {menuItems.map((item) => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              active={isActive(item.to)}
              onClick={() => navigate(item.to)}
            >
              {item.title}
            </MenuItem>
          ))}
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
