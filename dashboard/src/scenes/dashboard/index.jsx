import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { tokens } from '../../theme';

const Sidebar = ({ isSidebar }) => {
  if (!isSidebar) return null;
  return <div className="Sidebar"> {/* Sidebar content */} </div>;
};

const Dashboard = () => {
  const theme = useTheme();
  const colors = useMemo(() => tokens(theme.palette.mode), [theme.palette.mode]);

  const dashboardStyle = useMemo(() => ({
    margin: '2.5%',
  }), []);

  return (
    <Box style={dashboardStyle}>
      {/* ... rest of your JSX */}
    </Box>
  );
};

export default Dashboard;
