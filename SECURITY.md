# Security

## Audit history

| Date | Scope | Result |
|---|---|---|
| 2026-10-28 | `contracts/Token.sol` (STACH, ERC-20 + staking) — full manual review with a bug-bounty-grade adversarial lens | **2 critical bugs found and fixed** before any deployment: a `transferFrom` that destroyed recipient balances, and unbacked reward payouts breaking the total-supply invariant. Full write-up: [docs/AUDIT-2026-10.md](docs/AUDIT-2026-10.md) |
| 2026-10-28 | Post-deploy pass: auditlens (static-first lens engine) + Slither | 0 heuristic hits; every Slither detector hit triaged and neutralized — appendix in the same document |

Automated scanner flags (MetaMask/Blockaid, Dedaub) are explained line by
line in [docs/SECURITY-FLAGS.md](docs/SECURITY-FLAGS.md).

## Deployed contracts (source-verified on Sourcify and Basescan)

| Contract | Address | Networks |
|---|---|---|
| STACH token + staking | `0x82c5f9901CD9AEE3177053482b79aEA235507166` | Base mainnet, Base Sepolia |
| StachFaucet (testnet only) | `0x2fc5f8976d3f460D78dc6AbFBd84EFBC0Da0D1C4` | Base Sepolia |

Properties: fixed 42M supply, no owner/admin functions, no mint, no pause,
no tax, no proxy. Reward reserve (3M) held by the token contract itself.

## Reporting a vulnerability

Open a GitHub issue, or email the maintainer for anything sensitive. This
is an open experiment with tiny TVL — honest reports are welcomed and
credited in this file.

## Test suite

28 Hardhat tests (including regression tests for both fixed criticals) and
API unit tests run in CI on every push.
