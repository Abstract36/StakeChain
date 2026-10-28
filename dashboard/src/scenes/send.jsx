import React, { useState } from 'react';

const SendCryptocurrency = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleWalletAddressChange = (e) => {
    setWalletAddress(e.target.value);
  };

  const handleSendClick = () => {
    // Here, you can implement the logic to send cryptocurrency.
    // You can use a cryptocurrency API or a blockchain library to handle this.
    // For this example, we'll just display a message.
    alert(`Sending ${amount} cryptocurrency to ${recipient} to the wallet address ${walletAddress}`);
  };

  // Inline CSS styles
  const styles = {
    sendCryptoContainer: {
      backgroundColor: '#f5f5f5',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
      textAlign: 'center',
    },
    inputGroup: {
      margin: '10px 0',
    },
    label: {
      fontWeight: 'bold',
    },
    input: {
      padding: '5px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      width: '100%',
    },
    button: {
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      padding: '10px 20px',
      cursor: 'pointer',
    },
    buttonHover: {
      backgroundColor: '#0056b3',
    },
  };

  return (
    <div style={styles.sendCryptoContainer}>
      <h2>Send Cryptocurrency</h2>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Recipient Address:</label>
        <input
          type="text"
          value={recipient}
          onChange={handleRecipientChange}
          placeholder="Enter recipient address"
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Amount:</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount"
          style={styles.input}
        />
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Wallet Address:</label>
        <input
          type="text"
          value={walletAddress}
          onChange={handleWalletAddressChange}
          placeholder="Enter wallet address"
          style={styles.input}
        />
      </div>
      <button
        onClick={handleSendClick}
        style={styles.button}
        onMouseEnter={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
        onMouseLeave={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
      >
        Send
      </button>
    </div>
  );
};

export default SendCryptocurrency;
