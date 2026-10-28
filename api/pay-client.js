// End-to-end x402 payment test: signs a real EIP-3009 authorization with
// PAYER_PK and calls the paid endpoint twice (once to read the 402
// requirements, once with payment). The payer needs USDC on Base.
//
//   PAYER_PK=0x... API=https://stakechain-api.vercel.app node pay-client.js
import { ethers } from "ethers";

const API = process.env.API || "http://localhost:4000";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const wallet = new ethers.Wallet(process.env.PAYER_PK);
console.log("payer:", wallet.address);

const r1 = await fetch(`${API}/v1/best?asset=USDC`);
if (r1.status !== 402) {
  console.log(`expected 402, got ${r1.status} — is X402_ENFORCE on?`);
  process.exit(1);
}
const { accepts } = await r1.json();
const req = accepts[0];
console.log("requirements:", req.maxAmountRequired, "USDC(6dp) →", req.payTo);

const now = Math.floor(Date.now() / 1000);
const authorization = {
  from: wallet.address,
  to: req.payTo,
  value: req.maxAmountRequired,
  validAfter: 0,
  validBefore: now + 300,
  nonce: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
};
const signature = await wallet._signTypedData(
  { name: req.extra.name, version: req.extra.version, chainId: 8453, verifyingContract: USDC },
  {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  },
  authorization
);

const header = Buffer.from(
  JSON.stringify({
    x402Version: 1,
    scheme: "exact",
    network: "base",
    payload: { authorization, signature },
  })
).toString("base64");

const r2 = await fetch(`${API}/v1/best?asset=USDC`, { headers: { "X-PAYMENT": header } });
console.log("paid request status:", r2.status);
const settle = r2.headers.get("x-payment-response");
if (settle) {
  console.log("settlement:", JSON.parse(Buffer.from(settle, "base64").toString()));
}
console.log((await r2.text()).slice(0, 160));
