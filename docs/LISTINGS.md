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
| Basescan token update | BLOCKED on Basescan verification → needs free ETHERSCAN_API_KEY first | then "Token Update" form, sign from admin wallet |
| DEX Screener / GeckoTerminal | AUTO — pool is indexed within hours, nothing to submit | check dexscreener.com/base |
| CoinGecko | LATER — requires organic volume/liquidity; apply after real activity | free form |
| CoinMarketCap | LATER — same criteria | free form |
| Base token list (github.com/base-org) | LATER — requires CoinGecko/CMC listing first | PR when eligible |
| Trust Wallet assets | SKIPPED — paid review fee; our hosted token list already provides logos | revisit if volume justifies |

## Agent-side registries (the product's actual distribution)

| Target | Status | Notes |
|---|---|---|
| Official MCP registry | READY after `npm publish` of `agents/mcp-server` (needs your npm account) → `npx mcp-publisher publish` with GitHub auth | server.json manifest is in the repo |
| Smithery / mcp.so catalogs | READY — submit the GitHub repo via their sites (login required) | point at agents/mcp-server |
| x402 Bazaar (CDP discovery) | NEEDS CDP account — switch the API to the CDP facilitator with discovery on, then the endpoint self-lists | do together with X402_ENFORCE=true |
