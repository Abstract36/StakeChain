import React, { useState } from 'react';

const HistoryTrans = () => {
  // State to manage the input values
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');

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
      maxWidth: '400px',
      margin: '0 auto',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    input: {
      width: '100%',
      padding: '8px',
      marginBottom: '16px',
      border: '1px solid #ccc',
      borderRadius: '4px',
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

  // Function to handle the buy action
  const handleBuy = () => {
    // Implement your buy crypto logic here
    alert(`Buying ${cryptoAmount} crypto for ${fiatAmount} fiat`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Buy Crypto Window</h2>
      <input
        type="text"
        placeholder="Crypto Amount"
        style={styles.input}
        value={cryptoAmount}
        onChange={(e) => setCryptoAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Fiat Amount"
        style={styles.input}
        value={fiatAmount}
        onChange={(e) => setFiatAmount(e.target.value)}
      />
      <button style={styles.button} onClick={handleBuy}>
        Buy Crypto
      </button>
    </div>
  );
};

export default HistoryTrans;
