// Subscription keys on top of x402: a tier is bought with a one-off x402
// payment ($19/$99 USDC on Base), and the buyer receives a stateless,
// HMAC-signed API key valid for 30 days. Validation needs no database —
// the key carries its own tier and expiry, signed with API_KEY_SECRET.
//
// Key format: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
import crypto from "crypto";

export const TIERS = {
  developer: {
    price: "$19",
    days: 30,
    fairUse: "up to ~50k requests/month (fair use, not hard-enforced yet)",
  },
  professional: {
    price: "$99",
    days: 30,
    fairUse: "up to ~500k requests/month (fair use, not hard-enforced yet)",
  },
};

const b64u = (buf) => Buffer.from(buf).toString("base64url");

function sign(payloadB64, secret) {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function issueKey({ tier, payer }, secret, now = Date.now()) {
  const days = TIERS[tier].days;
  const payload = b64u(
    JSON.stringify({
      v: 1,
      tier,
      payer,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + days * 86400,
    })
  );
  return `${payload}.${sign(payload, secret)}`;
}

// Returns the decoded payload for a valid, unexpired key; null otherwise.
export function verifyKey(key, secret, now = Date.now()) {
  if (!key || !secret) return null;
  const dot = key.lastIndexOf(".");
  if (dot < 1) return null;
  const payloadB64 = key.slice(0, dot);
  const sig = key.slice(dot + 1);
  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!TIERS[payload.tier]) return null;
    if (payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}
