# Apify Node 20 base image — comes with apify CLI helpers + non-root user.
FROM apify/actor-node:20

# Layer 1: dependency manifest only — caches install layer when only
# source changes. Copying tsconfig here keeps `npx tsc` working in the
# build step further down with no extra mounts.
COPY --chown=myuser:myuser package*.json tsconfig.json ./

# Single install with devDeps included so `tsc` is available for the
# build step. `--include=dev` is required because the Apify base image
# sets NODE_ENV=production, which would otherwise make npm silently skip
# everything in devDependencies. `--ignore-scripts` skips both the
# postinstall on this package AND the upstream `apify-client` preinstall
# that pins pnpm — a hard-block on plain npm without it.
RUN npm install --no-audit --no-fund --ignore-scripts --include=dev

# Layer 2: actor source.
COPY --chown=myuser:myuser . ./

# Build TypeScript → dist/ (entrypoint: dist/main.js).
RUN npx tsc

# Strip devDeps from the final image for a smaller runtime footprint.
RUN npm prune --omit=dev --ignore-scripts \
    && npm cache clean --force \
    && echo "Node $(node --version), npm $(npm --version)"

CMD ["node", "dist/main.js"]
