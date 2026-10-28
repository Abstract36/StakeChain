require("@nomiclabs/hardhat-ethers");
require("dotenv").config({ path: "../contracts/.env" });

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    base: { url: "https://mainnet.base.org", accounts },
    berachain: { url: "https://berachain-rpc.publicnode.com", accounts },
    robinhood: { url: "https://rpc.mainnet.chain.robinhood.com", accounts },
  },
};
