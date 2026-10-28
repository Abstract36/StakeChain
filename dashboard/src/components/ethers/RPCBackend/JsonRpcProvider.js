const { ethers } = require('ethers');

// Function to link Provider, Signer, and interact with the RPC backend
async function linkProviderAndSigner(url, privateKey) {
    try {
        // If no URL is provided, use the default localhost URL
        const rpcUrl = url || 'http://localhost:8545';

        // Create a JsonRpcProvider (read-only)
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        // Create a Wallet (a type of Signer) using a private key
        const wallet = new ethers.Wallet(privateKey);

        // Link the Wallet to the Provider
        const linkedProvider = provider.connect(wallet);

        // Example: Get the signer's address using the Wallet
        const address = await wallet.getAddress();
        console.log('Signer Address:', address);

        // Example: Get the balance of an address using the linked Provider
        const balance = await linkedProvider.getBalance(address);
        console.log(`Balance of ${address}:`, ethers.utils.formatEther(balance));

        // Example: Send a transaction using the Wallet
        const transaction = await wallet.sendTransaction({
            to: '0xTargetAddress',
            value: ethers.utils.parseEther('0.1'),
        });
        console.log('Transaction Hash:', transaction.hash);

        // Example: Query block information using the linked Provider
        const blockNumber = await linkedProvider.getBlockNumber();
        console.log('Latest Block Number:', blockNumber);

    } catch (error) {
        console.error('Error linking Provider and Signer:', error.message);
        throw error;
    }
}

// Example Usage:
const customRPCUrl = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'; // Replace with your Infura key
const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234'; // Replace with a private key
linkProviderAndSigner(customRPCUrl, privateKey)
    .catch((error) => {
        // Handle errors
        console.error('Error:', error.message);
    });
