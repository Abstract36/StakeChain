const { ethers } = require('ethers');
const fs = require('fs');

// Generate a new private key
const privateKey = ethers.Wallet.createRandom().privateKey;

// Save the private key to a local file (for local development only)
fs.writeFileSync('privateKey.txt', privateKey);

console.log('Private key generated and saved to privateKey.txt');
