// Import ethers.js library
const { ethers } = require('ethers');
require('dotenv').config(); // Load environment variables from .env file

// Function to interact with Custom RPC Backend
async function interactWithCustomRPC(url) {
    try {
        // If no URL is provided, use the default localhost URL
        const rpcUrl = url || 'http://localhost:8545';

        // Create a JsonRpcProvider
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Get write access as an account by getting the signer
        const signer = await provider.getSigner();

        // Example: Print the signer's address
        const address = await signer.getAddress();
        console.log('Signer Address:', address);

        // Example: Perform other interactions with the signer
        // For instance, send a transaction
        // const transaction = await signer.sendTransaction({ to: '0xTargetAddress', value: ethers.utils.parseEther('0.1') });
        // console.log('Transaction Hash:', transaction.hash);

        // You can return the provider and signer for further use
        return { provider, signer };
    } catch (error) {
        console.error('Error interacting with Custom RPC:', error.message);
        throw error;
    }
}

// Load environment variables
const {
    MNEMONIC,
    INFURA_KEY,
    REACT_APP_INFURA_ETHEREUM,
    REACT_APP_INFURA_LINEA,
    REACT_APP_INFURA_POLYGON,
    REACT_APP_INFURA_OPTIMISM,
    REACT_APP_INFURA_ARBITRUM,
    REACT_APP_INFURA_PALM,
    REACT_APP_INFURA_AVALANCHE,
    REACT_APP_INFURA_NEAR,
    REACT_APP_INFURA_AURORA,
    REACT_APP_INFURA_STARKNET,
    REACT_APP_INFURA_CELO,
} = process.env;

// Example Usage:
const customRPCUrl = REACT_APP_INFURA_ETHEREUM; // Replace with the desired custom RPC URL
interactWithCustomRPC(customRPCUrl)
    .then(({ provider, signer }) => {
        // Perform additional operations with the provider and signer if needed
        // For example, querying contract data, sending transactions, etc.
    })
    .catch((error) => {
        // Handle errors
        console.error('Error:', error.message);
    });
