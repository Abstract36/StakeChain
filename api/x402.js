// Self-hosted x402 "exact" scheme for USDC on Base: verifies the client's
// EIP-3009 transferWithAuthorization signature and settles it on-chain with
// our own relayer — no third-party facilitator required.
//
// Client flow (per x402.org):
//   1. GET /v1/...            -> 402 + payment requirements (accepts[])
//   2. sign transferWithAuthorization for payTo/amount
//   3. retry with X-PAYMENT: base64({ x402Version, scheme, network, payload })
//   4. server verifies, settles, answers 200 + X-PAYMENT-RESPONSE
import { ethers } from "ethers";

const USDC_ABI = [
  "function name() view returns (string)",
  "function version() view returns (string)",
  "function authorizationState(address authorizer, bytes32 nonce) view returns (bool)",
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
];

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

export async function createX402({
  rpc,
  chainId,
  network,
  usdcAddress,
  payTo,
  priceAtomic, // string, USDC 6-decimals
  relayerPk,
  internalKey,
}) {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const relayer = relayerPk ? new ethers.Wallet(relayerPk, provider) : null;
  const usdc = new ethers.Contract(usdcAddress, USDC_ABI, relayer || provider);
  // EIP-712 domain read from the token itself so it can never drift
  const [name, version] = await Promise.all([usdc.name(), usdc.version()]);
  const domain = { name, version, chainId, verifyingContract: usdcAddress };

  const requirements = (req) => ({
    scheme: "exact",
    network,
    maxAmountRequired: priceAtomic,
    asset: usdcAddress,
    payTo,
    resource: req.originalUrl,
    description: "StakeChain Base yields data (per-request)",
    mimeType: "application/json",
    maxTimeoutSeconds: 60,
    extra: { name, version },
  });

  const refuse = (req, res, error) =>
    res.status(402).json({ x402Version: 1, error, accepts: [requirements(req)] });

  return async function x402(req, res, next) {
    if (internalKey && req.header("X-INTERNAL-KEY") === internalKey) return next();

    const header = req.header("X-PAYMENT");
    if (!header) return refuse(req, res, "payment required");

    try {
      const payment = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
      const { authorization: a, signature } = payment.payload || {};
      if (!a || !signature) return refuse(req, res, "malformed payload");

      const now = Math.floor(Date.now() / 1000);
      if (a.to.toLowerCase() !== payTo.toLowerCase())
        return refuse(req, res, "wrong payTo");
      if (ethers.BigNumber.from(a.value).lt(priceAtomic))
        return refuse(req, res, "insufficient amount");
      if (Number(a.validAfter) > now) return refuse(req, res, "not valid yet");
      if (Number(a.validBefore) < now + 6)
        return refuse(req, res, "authorization expiring");

      const signer = ethers.utils.verifyTypedData(domain, EIP3009_TYPES, a, signature);
      if (signer.toLowerCase() !== a.from.toLowerCase())
        return refuse(req, res, "bad signature");
      if (await usdc.authorizationState(a.from, a.nonce))
        return refuse(req, res, "nonce already used");

      if (!relayer) return refuse(req, res, "settlement relayer not configured");
      const sig = ethers.utils.splitSignature(signature);
      const tx = await usdc.transferWithAuthorization(
        a.from, a.to, a.value, a.validAfter, a.validBefore, a.nonce,
        sig.v, sig.r, sig.s
      );
      const receipt = await tx.wait(1);

      res.set(
        "X-PAYMENT-RESPONSE",
        Buffer.from(
          JSON.stringify({
            success: true,
            transaction: receipt.transactionHash,
            network,
            payer: a.from,
          })
        ).toString("base64")
      );
      return next();
    } catch (e) {
      return refuse(req, res, `settlement failed: ${String(e.reason || e.message).slice(0, 120)}`);
    }
  };
}
