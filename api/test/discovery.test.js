// A discovery document is a promise about what exists. The failure mode is
// not that it is malformed — it is that it stays correct-looking while the
// service moves underneath it, and an agent that trusts it pays for a route
// that is gone. These tests hold the documents against the catalogue, and
// the catalogue against the routes the server actually registers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { paidRoutes, freeRoutes } from "../catalogue.js";
import { x402Document, openApiDocument, llmsTxt, robotsTxt } from "../discovery.js";

const CONFIG = {
  baseUrl: "https://stakechain-api.vercel.app",
  payTo: "0x2Ab5A19aabc599C1a24CC0541ECB757b56976661",
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  network: "eip155:8453",
  priceUsdc: "0.001",
  priceAtomic: "1000",
  tiers: { developer: { price: "$19" }, professional: { price: "$99" } },
};
const paid = paidRoutes(CONFIG);
const server = readFileSync(new URL("../server.js", import.meta.url), "utf8");

test("every route in the catalogue is one the server actually registers", async () => {
  // The drift that matters: a path renamed in server.js and left standing
  // in the catalogue reads as a live endpoint to anyone following it.
  for (const r of [...freeRoutes, ...paid]) {
    const call = `app.${r.method.toLowerCase()}("${r.path}"`;
    assert.ok(
      server.includes(call),
      `${r.method} ${r.path} is advertised but not registered (looked for ${call})`
    );
  }
});

test("the x402 catalogue lists exactly the paid shelf, no more and no less", () => {
  const doc = x402Document(CONFIG);
  assert.deepEqual(
    doc.resources.sort(),
    paid.map((r) => `${CONFIG.baseUrl}${r.path}`).sort()
  );
  assert.equal(doc.entries.length, paid.length);
  assert.equal(doc.free.length, freeRoutes.length);
});

test("the advertised price and the atomic amount describe the same number", () => {
  // $19 advertised against 1000 atomic units would be an endpoint nobody
  // can buy and a quote nobody can check.
  for (const e of x402Document(CONFIG).entries) {
    const usd = Number(e.price.amount);
    assert.equal(
      Number(e.accepts[0].amount),
      Math.round(usd * 1e6),
      `${e.resource.url}: $${usd} advertised, ${e.accepts[0].amount} atomic`
    );
  }
});

test("every entry can actually be paid: rail, asset and recipient are named", () => {
  for (const e of x402Document(CONFIG).entries) {
    assert.equal(e.x402Version, 2);
    assert.equal(e.network, "eip155:8453", "CAIP-2, not the v1 shorthand");
    const a = e.accepts[0];
    assert.equal(a.scheme, "exact");
    assert.equal(a.network, "eip155:8453");
    assert.equal(a.asset, CONFIG.usdc);
    assert.equal(a.payTo, CONFIG.payTo);
    assert.ok(a.extra?.name && a.extra?.version, "the EIP-712 domain the payer must sign against");
  }
});

test("the catalogue states the one thing a payer gets wrong unprompted", () => {
  // Echoing `resource` as its url instead of the object settles nothing and
  // cost this project a working endpoint for a quarter of an hour.
  assert.match(x402Document(CONFIG).instructions, /exactly as the 402 sent it/);
});

test("openapi describes both shelves and marks which needs paying", () => {
  const doc = openApiDocument(CONFIG);
  for (const r of [...freeRoutes, ...paid]) {
    assert.ok(doc.paths[r.path], `${r.path} missing from openapi`);
    assert.ok(doc.paths[r.path][r.method.toLowerCase()], `${r.method} ${r.path} missing`);
  }
  for (const r of paid) {
    assert.ok(doc.paths[r.path].get.responses[402], `${r.path} does not mention 402`);
  }
  for (const r of freeRoutes) {
    assert.equal(
      doc.paths[r.path][r.method.toLowerCase()].responses[402],
      undefined,
      `${r.path} is free and must not advertise a payment`
    );
  }
});

test("openapi carries the response schema, not only an example", () => {
  const doc = openApiDocument(CONFIG);
  const vaults = doc.paths["/v1/vaults"].get.responses[200].content["application/json"];
  assert.ok(vaults.schema, "a buyer must be able to see the fields before paying");
  assert.ok(vaults.schema.required.includes("sources"));
});

test("llms.txt names every free route and admits what the service is not", () => {
  const txt = llmsTxt(CONFIG);
  for (const r of freeRoutes) assert.ok(txt.includes(r.path), `${r.path} missing from llms.txt`);
  assert.match(txt, /Market data,\s+not advice/);
  assert.match(txt, /a short series\s+is not evidence of stability/);
  assert.match(txt, /including how much of the\s+traffic is our own/);
});

test("robots.txt answers yes to the crawlers that check for themselves", () => {
  for (const bot of ["GPTBot", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot"]) {
    assert.match(robotsTxt, new RegExp(`User-agent: ${bot}\\nAllow: /`), `${bot} not addressed`);
  }
});
