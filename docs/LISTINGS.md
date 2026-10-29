# STACH listings dossier

Copy-paste material for every form. Facts only — no promises.

## Canonical facts

- Token: **Stakechain (STACH)** — `0x82c5f9901CD9AEE3177053482b79aEA235507166`
  (same address on Base mainnet 8453 and Base Sepolia 84532)
- Decimals 18 · fixed supply 42,000,000 · no mint function
- 3M held by the contract as the staking reward reserve; 39M admin/treasury:
  `0x2Ab5A19aabc599C1a24CC0541ECB757b56976661`
- Source verified: Sourcify exact match (both chains); Blockscout shows code
- Audit: https://github.com/Abstract36/StakeChain/blob/main/docs/AUDIT-2026-10.md
- Logo 256×256: https://abstract36.github.io/StakeChain/token/stach-256.png
- Logo 32×32 (Basescan form): https://abstract36.github.io/StakeChain/token/stach-32.png
- Token list: https://abstract36.github.io/StakeChain/tokenlist.json
- Website: https://abstract36.github.io/StakeChain/
- App: https://stakechain-app.vercel.app
- Pool: Uniswap v4 STACH/ETH on Base (0.0375% tier, full range)

## One-liner (EN)

> Stakechain (STACH) is the token of StakeChain Labs, an open-source
> staking-yield experiment on Base: a live yields aggregator for humans and
> AI agents (MCP + x402 machine payments), with audited built-in staking.

## Short description (EN, ~60 words)

> STACH is the fixed-supply (42M) token of StakeChain Labs, an open-source
> experiment on Base. The token contract includes audited flexible and
> locked staking pools backed by a real on-chain reward reserve. The
> project ships a Base yields aggregator consumed by humans via a dashboard
> and by AI agents via MCP, with x402 per-request machine payments.

## Where to submit

| Target | Status | Notes |
|---|---|---|
| Blockscout token info | READY — form in My Account on base.blockscout.com, owner wallet signature | use facts above |
| Basescan token update | REJECTED 2026-10-29 (first try) — likely causes: no own domain / email not on project domain, no team section with public profiles. Fix before resubmit: buy domain, domain email (Zoho/CF routing), move landing to domain, add Team section with a real public profile. Ownership verification stays valid | ownership signature needs the DEPLOYER key (contracts/.env), not the admin wallet |
| DEX Screener / GeckoTerminal | DONE — pool indexed (uniswap pair 0x80854cd8…) | liquidity still tiny; info/logo comes from token lists & Basescan |
| CoinGecko | LATER — requires organic volume/liquidity; apply after real activity | free form |
| CoinMarketCap | LATER — same criteria | free form |
| Base token list (github.com/base-org) | LATER — requires CoinGecko/CMC listing first | PR when eligible |
| Trust Wallet assets | SKIPPED — paid review fee; our hosted token list already provides logos | revisit if volume justifies |
| Base Ecosystem page | FORM — PRs to base-org/web no longer accepted; submit the Google Form linked from base.org/ecosystem (verify the link there, not from mirrors) | logo 192×192 PNG, name, description, URL |
| Webacy (risk scanner) | SUBMITTED 2026-10-28 — asset review requested after LP add + transparency tables; reply to gmail | honest "supply lock" wording: 3M reward reserve is programmatically locked in the contract, treasury is not (yet) |
| ethereum-lists/tokens | N/A — repo has no Base chain directory | |

## Agent-side registries (the product's actual distribution)

| Target | Status | Notes |
|---|---|---|
| Official MCP registry | DONE — `stakechain-mcp@0.1.1` on npm (2026-10-28), listed as `io.github.Abstract36/stakechain` | registry.modelcontextprotocol.io |
| mcp.so | DONE — listed 2026-10-28 ("Stakechain MCP Server", submitted by Deniss Solonin); root README now carries the parseable MCP config block so the catalog can replace the mis-parsed one | claim the listing via the "Claim" button; re-run its sandbox "fetch tool list" after README push |
| Smithery | DONE — submitted 2026-10-28 | |
| x402 Bazaar (CDP, official) | LIVE 2026-10-28 — prod settles via CDP facilitator, /v1/* routes discoverable; catalog entry appears after the first settled payment (run api/pay-client.js with a funded PAYER_PK to trigger) | deploys: git auto-deploy from main, Vercel project Root Directory = api |
| x402bazaar.org (third-party) | ON HOLD — listing requires a 1 USDC on-chain payment (to 0xfb1c478BD5567BdcD39782E0D6D23418bFda2430); if paid, list the FREE `/yields` endpoint at $0.001 (their proxy can't pay our EIP-3009 x402 on `/v1/*`), payout wallet = admin | low expectations: site shows 107 APIs, 0 total payments; not the official CDP Bazaar |
| x402 Bazaar (CDP discovery) | NEEDS CDP account — switch the API to the CDP facilitator with discovery on, then the endpoint self-lists | do together with X402_ENFORCE=true |
