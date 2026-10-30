# STACH multichain bridge (LayerZero V2 OFT)

**Design:** the real STACH never leaves Base. The Base-side
`StachOFTAdapter` locks it; LayerZero mints canonical wrapped STACH
(`StachOFT`) on the target chain and burns it on the way back. Global
supply stays 42,000,000 — no per-chain re-mints, no counterfeit copies.

## Deployed

| Piece | Chain | Address |
|---|---|---|
| StachOFTAdapter (lockbox) | Base (eid 30184) | `0xa670D30A01e51E728057dD08D9332f0787Aa245c` — verified |
| StachOFT | Arbitrum One (eid 30110) | `0x82c5f9901CD9AEE3177053482b79aEA235507166` — **LIVE, same address as STACH on Base**; peers wired both ways; 10 STACH bridged Base→Arbitrum 2026-10-30 (lock/mint confirmed on-chain) |
| StachOFT | Berachain (eid 30362) | pending gas |
| StachOFT | Robinhood Chain (eid 30416) | pending gas |

Endpoints (from metadata.layerzero-api.com): Base
`0x1a44076050125825900e736c501f859c50fE728c`; Berachain & Robinhood
`0x6F475642a6e85809B1c36Fa62763669b1b48DD5B`.

## Launch runbook (per target chain)

1. **Fund the deployer** `0x297423Ed6E5f9C2177ab70eE3b80Fd81000E734F`
   with native gas on the target chain:
   - Arbitrum One: ~0.0005 ETH (exchange withdrawal, network "Arbitrum One",
     or bridge from Base)
   - Berachain: ~1 BERA (exchange withdrawal, network "Berachain")
   - Robinhood Chain: ~0.001 ETH via the official Robinhood bridge
2. **Deploy the wrapped token** (from `bridge/`):
   ```bash
   npx hardhat run scripts/deploy.js --network berachain   # or robinhood
   ```
3. **Wire peers** (both directions):
   ```bash
   ADAPTER=0xa670D30A01e51E728057dD08D9332f0787Aa245c \
   OFT_BERACHAIN=<step-2 address> \
   npx hardhat run scripts/wire.js --network base

   ADAPTER=0xa670D30A01e51E728057dD08D9332f0787Aa245c \
   OFT_BERACHAIN=<step-2 address> \
   npx hardhat run scripts/wire.js --network berachain
   ```
4. **Test send** (bridge 10 STACH there and back) with `scripts/send.js`:
   ```bash
   # Base -> target (locks STACH, mints wrapped; approve handled in-script)
   ADAPTER=0xa670D30A01e51E728057dD08D9332f0787Aa245c TO=arbitrum AMOUNT=10 \
   npx hardhat run scripts/send.js --network base

   # target -> Base (burns wrapped, unlocks on Base)
   OFT_ARBITRUM=<address> TO=base AMOUNT=10 \
   npx hardhat run scripts/send.js --network arbitrum
   ```
   The LZ fee is quoted on-chain and paid in source-chain gas (typically
   well under $0.1); delivery is trackable at layerzeroscan.com/tx/<hash>.
5. Transfer adapter/OFT ownership from the deployer to the admin wallet
   once wiring is final.

## Honest notes

- One adapter per token, globally — this one is it; a second adapter would
  fork the supply accounting.
- Wrapped STACH on a chain with no audience is inventory, not adoption:
  deploy a target chain when there is a concrete integration or liquidity
  commitment there, not before.
- Bridge security inherits LayerZero's DVN defaults; for serious TVL,
  configure a custom DVN set before promoting the route.
