#!/bin/bash
# Wrapper that loads contracts/.env and runs b-side-bot.ts via bun.
# Usage (from repo root):  bash scripts/run-b-bot.sh
set -a
source contracts/.env
set +a
exec bun run scripts/b-side-bot.ts
