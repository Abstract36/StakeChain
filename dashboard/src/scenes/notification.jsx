import React from 'react';

const NotificationService = () => {
  // Inline CSS for the component
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    input: {
      width: '200px',
      padding: '8px',
      marginBottom: '16px',
    },
    button: {
      background: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer',
    },
  };

  // Function to handle the swap action
  const handleSwap = () => {
    // Implement your swap logic here
    alert('Swap action initiated');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Crypto Swap Bridge</h2>
      <input
        type="text"
        placeholder="Enter amount to swap"
        style={styles.input}
      />
      <button style={styles.button} onClick={handleSwap}>
        Swap
      </button>
    </div>
  );
};

export default NotificationService;
