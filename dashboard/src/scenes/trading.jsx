import React, { useState } from 'react';

const Trade = () => {
  // State to manage the input values
  const [stakingToken, setStakingToken] = useState('');
  const [rewardToken, setRewardToken] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');

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

  // Function to handle the stake action
  const handleStake = () => {
    // Implement your stake logic here
    alert(`Staking ${stakeAmount} ${stakingToken} to earn ${rewardToken}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Farming Window</h2>
      <input
        type="text"
        placeholder="Staking Token"
        style={styles.input}
        value={stakingToken}
        onChange={(e) => setStakingToken(e.target.value)}
      />
      <input
        type="text"
        placeholder="Reward Token"
        style={styles.input}
        value={rewardToken}
        onChange={(e) => setRewardToken(e.target.value)}
      />
      <input
        type="text"
        placeholder="Stake Amount"
        style={styles.input}
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
      />
      <button style={styles.button} onClick={handleStake}>
        Stake Tokens
      </button>
    </div>
  );
};

export default Trade;
