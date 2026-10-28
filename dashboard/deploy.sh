#!/bin/bash
# Deploys the dashboard to Vercel production and re-points the public alias
# (the alias is static — without this step prod serves the previous build).
set -euo pipefail
cd "$(dirname "$0")"

npx vercel deploy --prod --yes \
  --build-env GENERATE_SOURCEMAP=false \
  --build-env REACT_APP_YIELDS_API=https://stakechain-api.vercel.app \
  --build-env REACT_APP_STACH_ADDRESS=0x82c5f9901CD9AEE3177053482b79aEA235507166 \
  --build-env REACT_APP_CHAIN=base \
  --build-env REACT_APP_FAUCET_ADDRESS=0x2fc5f8976d3f460D78dc6AbFBd84EFBC0Da0D1C4 \
  --build-env REACT_APP_STACH_DEPLOY_BLOCK=53190000

# the public alias chains to the project's production domain, which always
# tracks the latest prod deployment — idempotent, never lags
npx vercel alias set dashboard-gold-eight-58.vercel.app stakechain-app.vercel.app
echo "live: https://stakechain-app.vercel.app"
