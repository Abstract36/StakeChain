# Scanner flags, explained line by line

Automated scanners (Dedaub Tok{In}, Blockaid/MetaMask) flag STACH
`0x82c5f9901CD9AEE3177053482b79aEA235507166`. Every flag maps to a specific,
intentional line of the verified source. Verdict drivers and the honest
status:

## "High Risk" driver: no sell simulation

Scanners refuse to simulate trades on pools under $100 liquidity (ours:
~$15). **This is the whole reason for the "High Risk" verdict** — not a
malicious pattern. It resolves by deepening liquidity, nothing else.

## Flag-by-flag

| Flag | Source of truth | Verdict |
|---|---|---|
| **Timebomb (danger)** — "behaviour changes at Oct 23 2027, slot 0x7" | Slot 7 is `periodFinish = deploy + 360 days` ([Token.sol](../contracts/contracts/Token.sol), constructor). After it, staking rewards simply stop accruing and new locked stakes revert (`lockUntil <= periodFinish`). The 3M emission program ends; transfers/swaps are untouched | By design, documented |
| **Blacklist / Whitelist (warning)** | There is no blacklist. The detector pattern-matches address-keyed mappings (`flexibleStakingUsers`, `lockedStakingUsers`, `rewards`) that gate *staking* amounts per user | False positive |
| **External Call (warning)** | `approveAndCall()` calls `receiveApproval` on the spender — ERC677-style helper, `nonReentrant` guarded | By design, guarded |
| **Transfer Guarded / TransferFrom Guarded (warnings)** | `_transfer` requires non-zero recipient and sufficient balance; `transferFrom` requires allowance. Standard ERC-20 checks — "guarded" means "can revert on invalid input" | Standard behavior |
| **Owner Privileges (info)** | The contract has **no owner, no admin functions** — scanners show "Owner Renounced". The constructor takes an initial holder address, nothing more | No privileges exist |

## What the same scan confirms (17/23 passed)

No mint. No pause. No tax (0%/0%), no tax switch. No self-destruct, no
proxy/upgrade, no trading caps or cooldowns, funds cannot be drained, no
allowance bypass. Supply fixed at 42M forever.

## Concentration flags

True and public: treasury `0x2Ab5...6661` holds ~92.8%, the contract's
reward reserve 7.14%. Day-one distribution of an experiment; the reserve
flows out through staking over 360 days.

Audit history: [AUDIT-2026-10.md](AUDIT-2026-10.md). Re-run the scan any
time — the source is verified on both chains.
