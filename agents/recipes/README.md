# Agent recipes

Runnable examples against the Base yields API. Copy one, run it, change
the rules — they are written to be edited rather than admired.

Nothing here needs a key or an account, and nothing here signs a
transaction.

```bash
cd agents/recipes && npm install
```

## `allocate-idle-usdc.js` — where should idle USDC go?

```bash
node allocate-idle-usdc.js 25000
```

Walks the shelf, applies constraints an allocator would actually hold
(size, curator fee, age, concentration, how much of the yield is
incentives), checks each survivor's profile, and prints its reasoning —
including why the highest rate lost.

The point it makes, on real data: a 16% vault gets rejected for holding
under $1M, and an 8.4% Aave reserve is reported as *not judged* because
rules written for vaults do not apply to it. Silently passing a check you
did not run is how an allocator fools itself.

Edit `RULES` at the top. The defaults are mine, not yours.

## `watch-positions.js` — is anything worth moving out of?

```bash
node watch-positions.js 0xYourAddress
```

Reads a wallet's positions from the chain, then answers the two questions
a spot rate cannot: has this rate drifted from its 30-day median, and does
the gap to a better market cover the gas to move?

Sample output:

```
Spark USDC Vault
  5.0002 USDC at 5.65% — about $0.28 a year
  30-day range 5.12–8.54%, median 5.98% (today is -0.33pp against it)
  → UltraYield USDC pays 16.02%: +$0.52 a year, gas back in 36 days
```

The payback line is the useful part: a better rate that takes 200 days to
repay its gas is not a better rate.

## `rebalance-weekly.js` — what should I actually move?

```bash
node rebalance-weekly.js 0xYourAddress
```

Reads every position across Morpho, Aave and Moonwell, proposes a target
per asset, and prices each move against the gas it costs. Most weeks the
answer is "nothing", and saying so plainly is the point — a better rate is
only better once it has repaid the gas to reach it.

Sample output, on a real wallet the day Moonwell was added:

```
6 position(s), $30 earning about $2.2 a year (7.34% blended)

Nothing worth moving this week.

Staying put:
  Spark USDC Vault (5.71%) — Moonwell USDC has only 0 day(s) of rate
    history — not yet a rate, just a number
  UltraYield USDC (15.93%) — only +0.28pp — under the 0.5pp floor
```

It refuses to chase a 16.21% market because that market is one day old
here. The same discipline the data argues for, applied to our own newest
source.

## Using the tools from an agent

```json
{ "mcpServers": { "stakechain": { "command": "npx", "args": ["-y", "stakechain-mcp"] } } }
```

Then an agent can ask directly:

> Find the best USDC market on Base with over $10M of deposits, check with
> `yield_history` whether that rate has held for the last month, and with
> `market_profile` what the curator charges. If the rate is a spike, say so
> instead of recommending it.

Tools: `list_base_yields`, `best_yield`, `list_lending_vaults`,
`yield_history`, `market_profile`. Full reference:
[docs/API.md](../../docs/API.md).

## Paying for the data

Free endpoints need nothing. The `/v1/*` tier speaks x402: HTTP 402 → sign
a USDC authorization on Base → retry. A reference client in ~60 lines is
[`api/pay-client.js`](../../api/pay-client.js).

---

Market data, not advice. Rates are variable; these recipes help you see
what you are choosing, not choose well.
