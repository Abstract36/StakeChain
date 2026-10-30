// A2A reselling (agent-to-agent): when a client asks for a chain we don't
// cover ourselves, we BUY the answer from another x402 seller and resell
// it — the service participates in the machine economy as a customer, not
// only as a merchant.
//
// Registry: A2A_UPSTREAMS env, JSON of { "<chain>": "<url with {query}>" }.
// Payer:    A2A_PAYER_PK env — a wallet holding USDC on Base.
// Both unset = graceful 501s; nothing else in the API depends on this.
import { payFetch, settlementOf } from "./x402-client.js";

function registry() {
  try {
    return JSON.parse(process.env.A2A_UPSTREAMS || "{}");
  } catch {
    return {};
  }
}

export function coveredByUpstream(chain) {
  return Boolean(registry()[chain]);
}

export async function buyUpstream(chain, queryString = "") {
  const tpl = registry()[chain];
  if (!tpl) return { status: 501, body: { error: `no upstream seller for chain "${chain}"` } };
  if (!process.env.A2A_PAYER_PK) {
    return { status: 501, body: { error: "A2A payer wallet not configured" } };
  }
  const url = tpl.includes("{query}") ? tpl.replace("{query}", queryString) : tpl;
  const res = await payFetch(url, { pk: process.env.A2A_PAYER_PK });
  const body = await res.json().catch(() => ({}));
  return {
    status: res.status,
    body: {
      ...body,
      resold_from_upstream: true,
      upstream_chain: chain,
      upstream_settlement: settlementOf(res),
    },
  };
}
