// Reference paying client: buys one call from the API and prints what it
// cost, which transaction settled it, and whether the facilitator indexed
// the endpoint in the x402 Bazaar.
//
//   PAYER_PK=0x... API=https://stakechain-api.vercel.app node pay-client.js
//
// The protocol work lives in x402-client.js, which speaks both x402 v1 and
// v2 — copy that file if you are building your own payer.
import { payFetch, settlementOf, bazaarStatusOf } from "./x402-client.js";

const API = process.env.API || "https://stakechain-api.vercel.app";
if (!process.env.PAYER_PK) {
  console.error("set PAYER_PK to a wallet holding USDC on Base (no gas needed)");
  process.exit(1);
}

const res = await payFetch(`${API}/v1/best?asset=USDC`, { pk: process.env.PAYER_PK });
console.log("status:", res.status);

const settle = settlementOf(res);
if (settle) {
  console.log("settled:", settle.transaction || JSON.stringify(settle));
  if (settle.transaction) console.log(`  https://basescan.org/tx/${settle.transaction}`);
}

const bazaar = bazaarStatusOf(res);
console.log("bazaar:", bazaar ? JSON.stringify(bazaar) : "no extension response (v1 server?)");

console.log((await res.text()).slice(0, 200));
