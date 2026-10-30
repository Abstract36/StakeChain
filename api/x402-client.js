// Minimal x402 "exact"-scheme paying client: GET the url, and on 402 sign
// an EIP-3009 USDC authorization and retry with X-PAYMENT. Works against
// our self-hosted settler and the Coinbase CDP facilitator alike (both
// speak the same exact scheme). The payer wallet needs USDC only — gas is
// paid by the settling side.
import { ethers } from "ethers";

const CHAIN_IDS = { base: 8453, "base-sepolia": 84532, arbitrum: 42161 };

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

export async function payFetch(url, { pk, headers = {} } = {}) {
  const first = await fetch(url, { headers });
  if (first.status !== 402) return first;

  const { accepts } = await first.json();
  const req = accepts[0];
  const wallet = new ethers.Wallet(pk);
  const now = Math.floor(Date.now() / 1000);

  const authorization = {
    from: wallet.address,
    to: req.payTo,
    value: String(req.maxAmountRequired),
    validAfter: "0",
    validBefore: String(now + 300),
    nonce: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
  };
  const signature = await wallet._signTypedData(
    {
      name: req.extra.name,
      version: req.extra.version,
      chainId: CHAIN_IDS[req.network] || 8453,
      verifyingContract: req.asset,
    },
    EIP3009_TYPES,
    authorization
  );

  const header = Buffer.from(
    JSON.stringify({
      x402Version: 1,
      scheme: "exact",
      network: req.network,
      payload: { authorization, signature },
    })
  ).toString("base64");

  return fetch(url, { headers: { ...headers, "X-PAYMENT": header } });
}

// Decodes the settle receipt a paid response carries, if any.
export function settlementOf(response) {
  const h = response.headers.get("x-payment-response");
  if (!h) return null;
  try {
    return JSON.parse(Buffer.from(h, "base64").toString("utf8"));
  } catch {
    return null;
  }
}
