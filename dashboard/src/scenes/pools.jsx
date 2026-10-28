import React from 'react';

const Pools = () => {
  // Inline CSS for the component
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '0 auto',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    pool: {
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '16px',
      marginBottom: '16px',
    },
    poolName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    poolDetails: {
      fontSize: '14px',
    },
  };

  // Sample data for staking pools
  const stakingPools = [
    {
      name: 'Pool 1',
      details: 'Earn rewards by staking your crypto in Pool 1.',
    },
    {
      name: 'Pool 2',
      details: 'Stake your tokens in Pool 2 and participate in governance.',
    },
    {
      name: 'Pool 3',
      details: 'Pool 3 offers a high APR for staking your tokens.',
    },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Crypto Staking Pools</h2>
      {stakingPools.map((pool, index) => (
        <div key={index} style={styles.pool}>
          <div style={styles.poolName}>{pool.name}</div>
          <div style={styles.poolDetails}>{pool.details}</div>
        </div>
      ))}
    </div>
  );
};

export default Pools;
