#!/bin/bash
# Wrapper: load contracts/.env then write ENS text records via regulator wallet.
# Usage (from repo root): bash scripts/run-ens-records.sh
set -a
source contracts/.env
set +a
exec bun run scripts/setup-ens-records.ts
