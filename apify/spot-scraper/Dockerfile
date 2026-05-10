# Apify Node 20 base image — comes with apify CLI, ts-node, build cache layout.
FROM apify/actor-node:20

# Copy package manifests first for layer-cache-friendly installs.
COPY --chown=myuser:myuser package*.json tsconfig.json ./

# Install dependencies (apify base image runs as non-root `myuser`).
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && echo "Node $(node --version), npm $(npm --version)"

# Copy actor source last so source-only changes invalidate fewer layers.
COPY --chown=myuser:myuser . ./

# Build the TypeScript actor; runtime entrypoint is dist/main.js.
RUN npm install --no-audit --no-fund typescript@5.6 \
    && npx tsc \
    && npm prune --omit=dev

CMD ["node", "dist/main.js"]
