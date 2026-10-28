Ganache is a local blockchain simulator or a personal blockchain for dapp development, It allows developers to simulate an Ethereum network locally on their machine, making it easier and faster to test and debug smart contracts without having to deploy them on a live network

https://github.com/trufflesuite/ganache#as-an-eip-1193-provider-only
start ganache right from your command line:
ganache
ganache-cli --port 8546


Use as a web3.js provider:
To use ganache as a Web3 provider:

const Web3 = require("web3");
const ganache = require("ganache");
const web3 = new Web3(ganache.provider());
NOTE: depending on your web3 version, you may need to set a number of confirmation blocks
const web3 = new Web3(ganache.provider(), null, { transactionConfirmationBlocks: 1 });



As an ethers.js provider:
const ganache = require("ganache");
const provider = new ethers.providers.Web3Provider(ganache.provider());


As a viem transport:
To use a ganache provider as a viem transport:
import { createWalletClient, custom } from "viem";
import { localhost } from "viem/chains";
import ganache from "ganache";
const client = createWalletClient({
  chain: localhost,
  transport: custom(ganache.provider())
});