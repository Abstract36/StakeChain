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
| Basescan token update | SHELVED — rejected 2026-10-29 (no own domain/domain email, no team section); user chose not to pursue domain/deanon for now. Resubmit later if that changes; address ownership verification stays valid | ownership signature needs the DEPLOYER key (contracts/.env), not the admin wallet |
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
| Official MCP registry | DONE — `io.github.Abstract36/stakechain` at **0.3.0** (2026-10-30), isLatest. Update with the `mcp-publisher` BINARY from github.com/modelcontextprotocol/registry/releases, run from agents/mcp-server — the npm package of that name is an unrelated project | npm `stakechain-mcp@0.3.0`: 5 tools incl. yield_history, market_profile |
| punkpeye/awesome-mcp-servers | PR OPEN 2026-10-30 — [#18101](https://github.com/punkpeye/awesome-mcp-servers/pull/18101), Finance & Fintech, agent fast-track tag; reopen with `bash docs/scripts/submit-awesome-pr.sh` if it closes | ~97k stars; the main shelf agent devs browse |
| mcp.so | DONE — listed 2026-10-28 ("Stakechain MCP Server", submitted by Deniss Solonin); root README now carries the parseable MCP config block so the catalog can replace the mis-parsed one | claim the listing via the "Claim" button; re-run its sandbox "fetch tool list" after README push |
| Smithery | DONE — submitted 2026-10-28 | |
| x402 Bazaar (CDP, official) | **NOT INDEXED — the one blocker worth fixing.** Settling through the CDP facilitator is not enough: the docs require the settled payment's `paymentPayload` to carry `extensions.bazaar` and `resource`, which our v1 stack does not send. Across 2,000 indexed entries (~4,950 network declarations) exactly 3 use the v1 format we emit. Fix: migrate `x402-express@1.2.0` -> `@x402/express@2.29.0` (v2 family, `createX402Server` / `paymentMiddlewareFromConfig`), settle one payment, read the `EXTENSION-RESPONSES` header for bazaar status success/processing/rejected; indexing follows within ~15 min. A resource with no settlement for 30 days is dropped again. | **Matters more than any directory:** Bazaar is the index other discovery services read — wafermap's `discover` tool queries it by name, x402helper and Fizzl search the same layer. It is how a paying agent finds a seller without anyone writing an issue. |
| x402bazaar.org (third-party) | ON HOLD — listing requires a 1 USDC on-chain payment (to 0xfb1c478BD5567BdcD39782E0D6D23418bFda2430); if paid, list the FREE `/yields` endpoint at $0.001 (their proxy can't pay our EIP-3009 x402 on `/v1/*`), payout wallet = admin | low expectations: site shows 107 APIs, 0 total payments; not the official CDP Bazaar |
