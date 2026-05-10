#!/bin/bash
# reset-demo.sh — fresh redeploy + addresses.json sync + push.
#
# Runs the canonical rehearsal-reset flow:
#   1. forge script Deploy --broadcast --verify  (3 min, ~0.000006 ETH)
#   2. extract new addresses from broadcast log
#   3. patch contracts/script/addresses.json sepolia section
#   4. commit + push to main
#   5. tell the operator to pull + restart the b-bot
#
# Usage (from repo root):  bash scripts/reset-demo.sh
#
# Requires: contracts/.env populated; bun + jq + foundry on PATH; main checked out.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$(git branch --show-current)" != "main" ]; then
  echo "FATAL: must be on main. Switch first." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "FATAL: working tree has uncommitted changes. Commit or stash first." >&2
  git status --short
  exit 1
fi

echo "─── Phase 1: Forge deploy + Sourcify verify ───"
cd contracts
set -a
source .env
set +a
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify --verifier sourcify | tail -20

echo ""
echo "─── Phase 2: Extract new addresses from broadcast log ───"
LOG="broadcast/Deploy.s.sol/11155111/run-latest.json"
test -f "$LOG" || { echo "FATAL: no broadcast log at $LOG"; exit 1; }

EURS=$(jq -r '[.transactions[] | select(.contractName=="EURS")][0].contractAddress' "$LOG")
REGISTRY=$(jq -r '[.transactions[] | select(.contractName=="ComplianceRegistry")][0].contractAddress' "$LOG")
CREDIT=$(jq -r '[.transactions[] | select(.contractName=="CarbonCredit")][0].contractAddress' "$LOG")
RETIREMENT=$(jq -r '[.transactions[] | select(.contractName=="Retirement")][0].contractAddress' "$LOG")
DEX=$(jq -r '[.transactions[] | select(.contractName=="CarbonDEX")][0].contractAddress' "$LOG")
REGULATOR=$(jq -r '[.transactions[] | select(.contractName=="Regulator")][0].contractAddress' "$LOG")

cat <<EOF
  EURS:               $EURS
  ComplianceRegistry: $REGISTRY
  CarbonCredit:       $CREDIT
  Retirement:         $RETIREMENT
  CarbonDEX:          $DEX
  Regulator:          $REGULATOR
EOF

echo ""
echo "─── Phase 3: Patch contracts/script/addresses.json ───"
cd ..
ADDR_JSON="contracts/script/addresses.json"

TMP=$(mktemp)
jq --arg e "$EURS" --arg r "$REGISTRY" --arg c "$CREDIT" --arg ret "$RETIREMENT" --arg d "$DEX" --arg reg "$REGULATOR" --arg date "$(date -u +%Y-%m-%d)" '
  .networks.sepolia.contracts = {
    "EURS": $e,
    "ComplianceRegistry": $r,
    "CarbonCredit": $c,
    "Retirement": $ret,
    "CarbonDEX": $d,
    "Regulator": $reg
  } | .networks.sepolia.deployedAt = $date
' "$ADDR_JSON" > "$TMP"
mv "$TMP" "$ADDR_JSON"

echo "✓ addresses.json updated"

echo ""
echo "─── Phase 4: Commit + push ───"
git add "$ADDR_JSON"
git commit -m "Sepolia redeploy: rehearsal canvas reset

Fresh deploy via Deploy.s.sol; pool seeded; B pre-seeded with 500 EUA. New addresses on the sepolia section of addresses.json. Bot needs restart with new DEX address.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main

echo ""
echo "─── DONE ───"
echo ""
echo "Next:"
echo "  1. Pull main on any other working tree:  git pull"
echo "  2. Restart the b-bot:  pkill -f b-side-bot; bash scripts/run-b-bot.sh"
echo "  3. Open frontend; demo flow ready against fresh chain."
