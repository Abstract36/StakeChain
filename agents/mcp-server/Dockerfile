# Runs the StakeChain MCP server for automated sandbox checks (Glama).
#
# The server is a thin stdio client over a public, read-only HTTP API: it
# holds no keys, writes nothing, and signs nothing. The paid tier is
# surfaced as an x402 402 response for the calling agent to handle — this
# process never moves funds.
FROM node:22-alpine

WORKDIR /app

# Only the manifest first, so dependency installs cache across edits
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js server.json README.md ./

# Nothing here needs root
USER node

ENV NODE_ENV=production
# Point at a different instance by overriding this
ENV STAKECHAIN_API=https://stakechain-api.vercel.app

ENTRYPOINT ["node", "server.js"]
