require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Cheapest sensible mainnet targets: Base (L2) and Polygon PoS.
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts,
    },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      accounts,
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts,
    },
    bsc: {
      url: process.env.BSC_RPC || "https://bsc-dataseed.binance.org",
      accounts,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts,
    },
  },
  // Sourcify's v1 API (the one this plugin version calls) was removed; the
  // explorers below cover verification.
  sourcify: { enabled: false },
  etherscan: {
    // Etherscan v2: one key covers every supported chain, Base included.
    // Blockscout ignores the key but wants a non-empty one.
    apiKey: process.env.ETHERSCAN_API_KEY || "blockscout",
    // A custom chain wins over the built-in one by chainId, whatever its
    // `network` label, so the two explorers cannot be configured at once:
    //   npx hardhat verify --network base ...                  -> Basescan
    //   VERIFY_ON=blockscout npx hardhat verify --network base  -> Blockscout
    customChains:
      process.env.VERIFY_ON === "blockscout"
        ? [
            {
              network: "base",
              chainId: 8453,
              urls: {
                apiURL: "https://base.blockscout.com/api",
                browserURL: "https://base.blockscout.com",
              },
            },
            {
              network: "baseSepolia",
              chainId: 84532,
              urls: {
                apiURL: "https://base-sepolia.blockscout.com/api",
                browserURL: "https://base-sepolia.blockscout.com",
              },
            },
          ]
        : [],
  },
};
