import React, { useState } from 'react';

const Lending = () => {
  // State to manage the input values
  const [lendingToken, setLendingToken] = useState('');
  const [amount, setAmount] = useState('');

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

  // Function to handle the lend action
  const handleLend = () => {
    // Implement your lending logic here
    alert(`Lending ${amount} ${lendingToken}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Lending Service</h2>
      <input
        type="text"
        placeholder="Lending Token"
        style={styles.input}
        value={lendingToken}
        onChange={(e) => setLendingToken(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        style={styles.input}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button style={styles.button} onClick={handleLend}>
        Lend Tokens
      </button>
    </div>
  );
};

export default Lending;
