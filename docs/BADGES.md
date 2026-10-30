# Yield badges

Live Base rates as an SVG you can drop into any README, docs page or
dashboard. No key, no signup, no tracking — just an image that stays
current.

```markdown
![Aave USDC](https://stakechain-api.vercel.app/badge/aave-usdc.svg)
```

![Aave USDC](https://stakechain-api.vercel.app/badge/aave-usdc.svg)
![Spark USDC](https://stakechain-api.vercel.app/badge/sparkusdc.svg)
![Gauntlet USDC Prime](https://stakechain-api.vercel.app/badge/gtusdcp.svg)

## Naming a market

The slug is whatever you'd guess from the table — any of these resolve:

| Form | Example |
|---|---|
| `<protocol>-<asset>` | `aave-usdc`, `aave-weth`, `morpho-usdc` |
| vault or reserve symbol | `sparkusdc`, `gtusdcp`, `steakusdc`, `edgeusdc` |
| vault address | `vault-0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` |
| DefiLlama pool id | `a5fab52f-73fa-4f44-9c09-9af1eb20996c` |

A market we don't know renders a plain "market not found" badge rather
than a broken image.

## Options

| Query | Effect |
|---|---|
| `?label=Spark` | Replaces the left-hand text |
| `?kind=tvl` | Shows TVL instead of APY |

```markdown
![Spark](https://stakechain-api.vercel.app/badge/sparkusdc.svg?label=Spark&kind=tvl)
```

## Project badge

`/badge/stats.svg` reports settled x402 payments, and always names how many
came from outside the project — a bare count would read as demand while
every payment is still our own agent's.

![x402 payments](https://stakechain-api.vercel.app/badge/stats.svg)

## Notes

- Rates come from the same source as the API: Aave from the Pool contract
  and oracle, Morpho from its API. Cached for 5 minutes.
- GitHub serves README images through its camo proxy, which caches them for
  longer — expect a badge in a README to lag the live rate by up to an hour.
- MIT, like everything else here. Embed freely; no attribution required.
