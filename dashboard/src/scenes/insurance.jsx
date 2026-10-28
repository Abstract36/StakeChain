import React from 'react';

const Insurance = () => {
  const styles = {
    container: {
      backgroundColor: '#f0f0f0',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    title: {
      fontSize: '24px',
      color: '#333',
    },
    description: {
      fontSize: '16px',
      color: '#666',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Defi Insurance</h1>
      <p style={styles.description}>
        Protect your DeFi assets with our comprehensive insurance solutions.
      </p>
    </div>
  );
};

export default Insurance;
