import React, { useState } from 'react';

const DepositCrypto = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('Bitcoin');
  const [depositAmount, setDepositAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleCryptoChange = (event) => {
    setSelectedCrypto(event.target.value);
  };

  const handleAmountChange = (event) => {
    setDepositAmount(event.target.value);
  };

  const handleDeposit = () => {
    if (depositAmount === '') {
      setMessage('Please enter a deposit amount.');
    } else {
      setMessage(`Successfully deposited ${depositAmount} ${selectedCrypto}.`);
    }
  };

  const styles = {
    depositCrypto: {
      width: '300px',
      margin: '0 auto',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      textAlign: 'center',
    },
    cryptoSelection: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '3px',
      marginTop: '5px',
    },
    button: {
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
    },
    message: {
      color: 'green',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={styles.depositCrypto}>
      <h2>Deposit Cryptocurrency</h2>
      <div style={styles.cryptoSelection}>
        <label htmlFor="crypto-select" style={styles.label}>
          Select Cryptocurrency:
        </label>
        <select
          id="crypto-select"
          value={selectedCrypto}
          onChange={handleCryptoChange}
          style={styles.input}
        >
          <option value="Bitcoin">Bitcoin</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Litecoin">Litecoin</option>
        </select>
      </div>
      <div style={styles.amountInput}>
        <label htmlFor="amount" style={styles.label}>
          Enter Amount:
        </label>
        <input
          type="number"
          id="amount"
          value={depositAmount}
          onChange={handleAmountChange}
          style={styles.input}
        />
      </div>
      <button onClick={handleDeposit} style={styles.button}>
        Deposit
      </button>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

export default DepositCrypto;
