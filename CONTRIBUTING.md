# Contributing

The useful thing to know first: **a wrong number is a bug here**. This
project's only real claim is that its data is accurate and checkable, so a
rate that disagrees with the protocol it came from is worth an issue more
than a feature request is.

## Good places to start

- **Add a protocol.** The yields table covers Morpho and Aave with
  deposit support; Moonwell, Euler and Fluid are on Base and are not
  covered. See [`api/aave.js`](api/aave.js) for the shape — read the
  protocol directly rather than through an aggregator, because
  aggregators have gaps (DefiLlama reports Aave's Base USDC reserve,
  ~$172M, with zero TVL).
- **Add a recipe.** [`agents/recipes/`](agents/recipes/) holds runnable
  examples. A good one answers a question an allocator actually has and
  shows its reasoning, including the rejected options.
- **Improve a profile signal.** [`api/profile.js`](api/profile.js) weighs
  six observable signals. If one is weighted wrongly, argue it with
  numbers — the formula is published precisely so it can be disputed.
- **Find a data error.** Compare any figure against the protocol's own
  UI. If they differ, that is the issue we most want.

## Ground rules

- **Every claim must be checkable.** No projected yields, no "best" or
  "first", nothing a reader cannot verify on-chain or in the repo.
- **Read the protocol, not a summary**, where the two are available.
- **Missing data is reported, not guessed.** A signal without enough
  observations says so and is dropped from the weighting; a check that
  cannot be applied is listed as not applied.
- **No token talk in the product.** STACH is an experiment documented in
  [docs/TOKENOMICS.md](docs/TOKENOMICS.md), including its weaknesses. The
  data is the product.

## Running things

```bash
cd api && npm install && npm start      # :4000
cd api && node --test                   # tests
cd contracts && npm install && npx hardhat test
cd dashboard && npm install --legacy-peer-deps && npm start
```

The dashboard reads `REACT_APP_YIELDS_API`; `.env.production` points it at
the hosted API so a build works anywhere.

## Pull requests

Small and single-purpose beats comprehensive. Explain what changes for
someone using the thing, not what you touched. If a change affects a
number anyone might act on, say how you verified it.

MIT, like everything here.
