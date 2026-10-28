require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = process.env.MNEMONIC;
const infuraKey = process.env.INFURA_KEY;

const getHDWalletProvider = (networkName) => {
  return new HDWalletProvider(mnemonic, `https://${networkName}.infura.io/v3/${infuraKey}`);
};

module.exports = {
  networks: {
    goerli: {
      provider: () => getHDWalletProvider('goerli'),
      network_id: 5,
      chain_id: 5
    },
    lineaGoerli: {
      provider: () => getHDWalletProvider('linea-goerli'),
      network_id: 5,
      chain_id: 5
    },
    polygonMumbai: {
      provider: () => getHDWalletProvider('polygon-mumbai'),
      network_id: 80001
    },
    optimismGoerli: {
      provider: () => getHDWalletProvider('optimism-goerli'),
      network_id: 420
    },
    arbitrumGoerli: {
      provider: () => getHDWalletProvider('arbitrum-goerli'),
      network_id: 421613
    },
    palmTestnet: {
      provider: () => getHDWalletProvider('palm-testnet'),
      network_id: 11297108109
    },
    avalancheFuji: {
      provider: () => getHDWalletProvider('avalanche-fuji'),
      network_id: 43113
    },
    nearTestnet: {
      provider: () => getHDWalletProvider('near-testnet'),
      network_id: 1313161555
    },
    auroraTestnet: {
      provider: () => getHDWalletProvider('aurora-testnet'),
      network_id: 1313161555
    },
    starknetGoerli: {
      provider: () => getHDWalletProvider('starknet-goerli'),
      network_id: 5
    },
    celoAlfajores: {
      provider: () => getHDWalletProvider('celo-alfajores'),
      network_id: 44787
    }
    // Add more networks as needed
  },

  compilers: {
    solc: {
      version: "^0.8.13", // Specify the version of the Solidity compiler
    },
  },
  // ... (other configurations like compilers, mocha)
};
