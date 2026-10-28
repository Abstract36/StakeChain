import React, { useState } from "react";
import { Box, IconButton, useTheme, Menu, MenuItem } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import { Link } from "react-router-dom";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MapIcon from "@mui/icons-material/Map";
import ForumIcon from "@mui/icons-material/Forum";
import GavelIcon from "@mui/icons-material/Gavel";
import PolicyIcon from "@mui/icons-material/Policy";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CircleNotificationsIcon from "@mui/icons-material/CircleNotifications";
import PublicIcon from "@mui/icons-material/Public";
import StarsIcon from "@mui/icons-material/Stars";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import { Web3Button } from "@thirdweb-dev/react";
import { useContractWrite, useContract, ConnectWallet,  localWallet, } from "@thirdweb-dev/react";
import styles from '../../scenes/global/topbar.module.css'; // Import the CSS module
import { darkTheme, lightTheme } from "@thirdweb-dev/react";

// Separate component for the ConnectWallet button
function ConnectWalletButton() {
  const { data: contract } = useContract("{{contract_address}}"); // WRITE CONTRACT ADDRESS
  const { mutateAsync, isLoading, error } = useContractWrite(contract,"functionName",);
  
  return (
    <ConnectWallet
      modalSize="compact"
      theme={darkTheme({
        fontFamily: "Inter, sans-serif",
        colors: {
          modalBg: "#000000",
          accentText: "red",
          // ... etc
        },
      })}
      switchToActiveChain={true}
      contractAddress="0x////3"
      supportedWallets={[ localWallet() ]}
      action={(contract) => contract.erc721.claim(1)}
      style={{
        backgroundColor: "red",
        color: "white",
      }}
    >
      <Web3Button 
      theme="dark"
      //contractAbi={Abi} // Pass the ABI you imported (replace 'Abi' with your ABI)
      action={(contract) => console.log(contract)} // Logic to execute when clicked
      onSuccess={(result) => alert("Success!")}
      onError={(error) => alert("Something went wrong!")}
      onSubmit={() => console.log("Transaction submitted")}
      variant="contained"
      connectWallet={{
    btnTitle: "Connect",
    modalTitle: "Login",
    // ... etc
  }}>
        Call myFunctionName from the connected wallet
      </Web3Button>
    </ConnectWallet>
  );
}

// Separate component for the search bar
function SearchBar() {
  return (
    <Box className={styles.searchBar}>
      <IconButton className={styles.searchIconButton}>
        <SearchIcon />
      </IconButton>
      <InputBase
        className={styles.searchInput}
        placeholder="Search Tokens and Pools"
      />
    </Box>
  );
}

// Separate component for the dropdown menu items
function DropdownMenuItem({ to, icon, label }) {
  const colors = tokens(useTheme().palette.mode);

  return (
    <MenuItem className={styles.dropdownMenuItem}>
      <Link to={to} className={styles.dropdownMenuLink}>
        {icon} {label}
      </Link>
    </MenuItem>
  );
}

// Separate component for the dropdown menus
function DropdownMenu({ items, anchorEl, onClose }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      className={styles.dropdownMenu}
    >
      {items.map((item, index) => (
        <DropdownMenuItem key={index} {...item} />
      ))}
    </Menu>
  );
}

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [anchorElSettings, setAnchorElSettings] = useState(null);
  const [anchorElProfile, setAnchorElProfile] = useState(null);

  const handleNotificationsMenuClick = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleSettingsMenuClick = (event) => {
    setAnchorElSettings(event.currentTarget);
  };

  const handleProfileMenuClick = (event) => {
    setAnchorElProfile(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElNotifications(null);
    setAnchorElSettings(null);
    setAnchorElProfile(null);
  };

  const notificationsMenuItems = [
    {
      to: "/notification",
      icon: <CircleNotificationsIcon />,
      label: "Notification Center",
    },
    { to: "/messages", icon: <MailOutlineIcon />, label: "My Messages" },
  ];

  const settingsMenuItems = [
    { to: "/myearnings", icon: <StarsIcon />, label: "My Earnings" },
    {
      to: "/profile-settings",
      icon: <BuildCircleIcon />,
      label: "Profile Settings",
    },
    { to: "/language", icon: <PublicIcon />, label: "Language" },
  ];

  const profileMenuItems = [
    { to: "/docs", icon: <MenuBookIcon />, label: "Docs" },
    { to: "/roadmap", icon: <MapIcon />, label: "Roadmap" },
    { to: "/forum", icon: <ForumIcon />, label: "Forum" },
    { to: "/terms", icon: <GavelIcon />, label: "Terms" },
    {
      to: "/privacy-policy",
      icon: <PolicyIcon />,
      label: "Privacy Policy",
    },
    {
      to: "/business-enquiries",
      icon: <BusinessCenterIcon />,
      label: "Business Enquiries",
    },
    { to: "/help", icon: <HelpCenterIcon />, label: "Help" },
  ];

  return (
    <Box
      className={styles.topbarContainer}
      display="flex"
      alignItems="flex-start"
      padding="10px 30px"
      position="fixed"
      top="0"
      right="0"
      zIndex="1000"
    >
      <Box className={styles.connectWalletButton}>
        <ConnectWalletButton />
      </Box>

      <SearchBar />

      <Box display="flex">
      <img src={`../../assets/rocket3.png`} alt="StakeChain_Rocket" /> {/* Placeholder for rocket.png */}

        <IconButton
          className={styles.icoButton}
          onClick={colorMode.toggleColorMode}
        >
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>

        <IconButton
          className={styles.icoButton}
          onClick={handleNotificationsMenuClick}
        >
          <NotificationsOutlinedIcon />
        </IconButton>
        <DropdownMenu
          items={notificationsMenuItems}
          anchorEl={anchorElNotifications}
          onClose={handleClose}
        />

        <IconButton
          className={styles.icoButton}
          onClick={handleSettingsMenuClick}
        >
          <SettingsOutlinedIcon />
        </IconButton>
        <DropdownMenu
          items={settingsMenuItems}
          anchorEl={anchorElSettings}
          onClose={handleClose}
        />

        <IconButton
          className={styles.icoButton}
          onClick={handleProfileMenuClick}
        >
          <PersonOutlinedIcon />
        </IconButton>
        <DropdownMenu
          items={profileMenuItems}
          anchorEl={anchorElProfile}
          onClose={handleClose}
        />
      </Box>
    </Box>
  );
};

export default Topbar;
