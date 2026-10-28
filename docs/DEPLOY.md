# Zero-budget hosting guide

Three deployables, three free tiers. Total monthly cost: $0.

## 1. Yields API → Vercel

```bash
cd api
npx vercel --prod        # first run: log in, accept defaults
```

- `api/vercel.json` is already configured (Express app exported for serverless).
- Set env vars in the Vercel dashboard if you want non-defaults:
  `X402_ENFORCE`, `PAY_TO`, `PRICE_USDC`.
- Note the resulting URL, e.g. `https://stakechain-api.vercel.app`.

## 2. Dashboard → Vercel

```bash
cd dashboard
npx vercel --prod
```

- `dashboard/vercel.json` handles SPA routing.
- Required env vars (Vercel → Project → Settings → Environment Variables):
  - `REACT_APP_YIELDS_API` = the API URL from step 1
  - `REACT_APP_STACH_ADDRESS` = `0x82c5f9901CD9AEE3177053482b79aEA235507166`
- CI build is verified: `CI=true npm run build` passes (265 kB gzip).

## 3. Landing → GitHub Pages

- `.github/workflows/pages.yml` deploys `website/` on every push to `main`.
- One-time: repo Settings → Pages → Source: **GitHub Actions**.
- Pages works on private repos only with a paid plan — on the free plan the
  landing goes live together with the public relaunch of the repo.

### After deploying

Replace the two `http://localhost:5000` links in `website/index.html` with
the dashboard's Vercel URL, and the `http://localhost:4000` fetch with the
API URL. Then re-push — Pages redeploys automatically.

## Checks

- API: `curl https://<api-url>/health` → `{"ok":true,...}`
- Dashboard: open `/staking`, connect, numbers load from Base Sepolia.
- Landing: the "Live right now" table renders (it hides itself if the API
  is unreachable).
