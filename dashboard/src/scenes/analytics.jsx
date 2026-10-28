import React from 'react';
import { useSelector } from 'react-redux';

const Analytics = () => {
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    data: {
      fontSize: '16px',
      lineHeight: '1.5',
    },
  };

  // Use useSelector to access data from the Redux store
  const totalValueLocked = useSelector((state) => state.analytics.totalValueLocked);
  const numberOfUsers = useSelector((state) => state.analytics.numberOfUsers);
  const transactionsToday = useSelector((state) => state.analytics.transactionsToday);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>DEFI Analytics</h1>
      <div style={styles.data}>
        <p>Total Value Locked: ${totalValueLocked}</p>
        <p>Number of Users: {numberOfUsers}</p>
        <p>Transactions Today: {transactionsToday}</p>
      </div>
    </div>
  );
};

export default Analytics;
