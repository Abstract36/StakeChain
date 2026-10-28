// services/ethersServices.jsx

import { ethers } from 'ethers';

// Initialize the Ethereum provider
const provider = new ethers.providers.JsonRpcProvider('YOUR_JSON_RPC_URL');

// Initialize a wallet (optional)
// const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Function to get the balance of an Ethereum address
export const getBalance = async (address) => {
    try {
        const balance = await provider.getBalance(address);
        return ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error.message);
        throw error;
    }
};

// Function to send a transaction
export const sendTransaction = async (to, value, privateKey) => {
    try {
        // Create a wallet instance for signing the transaction
        const wallet = new ethers.Wallet(privateKey, provider);

        // Build the transaction
        const transaction = {
            to,
            value: ethers.utils.parseEther(value),
        };

        // Sign and send the transaction
        const signedTransaction = await wallet.sendTransaction(transaction);
        return signedTransaction;
    } catch (error) {
        console.error('Error sending transaction:', error.message);
        throw error;
    }
};

// Other ethers.js related functions can be added as needed
