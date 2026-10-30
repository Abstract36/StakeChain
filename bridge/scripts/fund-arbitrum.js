// One-off: bridges 0.0007 ETH of the deployer's Base balance to Arbitrum
// One via Relay, to pay for the StachOFT deployment there.
//   node scripts/fund-arbitrum.js
require("dotenv").config({ path: "../contracts/.env" });
const { ethers } = require("ethers");

const DEPLOYER = "0x297423Ed6E5f9C2177ab70eE3b80Fd81000E734F";
const AMOUNT_WEI = "700000000000000"; // 0.0007 ETH

(async () => {
  const quote = await (
    await fetch("https://api.relay.link/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: DEPLOYER,
        recipient: DEPLOYER,
        originChainId: 8453,
        destinationChainId: 42161,
        originCurrency: "0x0000000000000000000000000000000000000000",
        destinationCurrency: "0x0000000000000000000000000000000000000000",
        tradeType: "EXACT_INPUT",
        amount: AMOUNT_WEI,
      }),
    })
  ).json();
  if (!quote.steps) throw new Error("quote failed: " + JSON.stringify(quote).slice(0, 200));
  console.log("to receive on Arbitrum:", quote.details.currencyOut.amountFormatted, "ETH");

  const item = quote.steps[0].items[0].data;
  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider("https://mainnet.base.org")
  );
  if (wallet.address.toLowerCase() !== DEPLOYER.toLowerCase())
    throw new Error("PRIVATE_KEY is not the deployer");

  const tx = await wallet.sendTransaction({
    to: item.to,
    value: ethers.BigNumber.from(item.value),
    data: item.data,
  });
  console.log("base tx:", tx.hash);
  await tx.wait();
  console.log("confirmed on Base; waiting for Arbitrum delivery…");

  const arb = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const bal = await arb.getBalance(DEPLOYER);
    if (bal.gt(0)) {
      console.log("ARBITRUM BALANCE:", ethers.utils.formatEther(bal), "ETH — done");
      return;
    }
  }
  console.log("not delivered after 5 min — check https://relay.link/transaction/" + tx.hash);
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
