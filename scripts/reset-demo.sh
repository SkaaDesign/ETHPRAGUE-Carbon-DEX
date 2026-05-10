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
# Requires: contracts/.env populated; bun + node + foundry on PATH; main checked out.

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

# Use node (always present in this repo) instead of jq for portability —
# Windows Git Bash typically doesn't have jq installed. Use readFileSync
# instead of require() so the relative path is resolved from bash's cwd
# (require resolves from the script's location, which is undefined for -e).
extract() {
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const t=j.transactions.find(t=>t.contractName===process.argv[2]);if(!t){process.exit(1)}console.log(t.contractAddress)" "$LOG" "$1"
}

EURS=$(extract EURS)
REGISTRY=$(extract ComplianceRegistry)
CREDIT=$(extract CarbonCredit)
RETIREMENT=$(extract Retirement)
DEX=$(extract CarbonDEX)
REGULATOR=$(extract Regulator)

cat <<EOF
  EURS:               $EURS
  ComplianceRegistry: $REGISTRY
  CarbonCredit:       $CREDIT
  Retirement:         $RETIREMENT
  CarbonDEX:          $DEX
  Regulator:          $REGULATOR
EOF

echo ""
echo "─── Phase 3: Patch contracts/script/addresses.json + web/lib/contracts.ts ───"
cd ..
ADDR_JSON="contracts/script/addresses.json"
WEB_TS="web/lib/contracts.ts"
TODAY=$(date -u +%Y-%m-%d)

# addresses.json: surgical replace of the sepolia.contracts object + deployedAt.
node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('$ADDR_JSON','utf8'));
j.networks.sepolia.contracts = {
  EURS: '$EURS',
  ComplianceRegistry: '$REGISTRY',
  CarbonCredit: '$CREDIT',
  Retirement: '$RETIREMENT',
  CarbonDEX: '$DEX',
  Regulator: '$REGULATOR'
};
j.networks.sepolia.deployedAt = '$TODAY';
fs.writeFileSync('$ADDR_JSON', JSON.stringify(j, null, 2) + '\n');
"
echo "✓ addresses.json updated"

# web/lib/contracts.ts: regex replace of each address line in the SEPOLIA block.
node -e "
const fs=require('fs');
let s=fs.readFileSync('$WEB_TS','utf8');
const replace=(name,addr)=>{
  s=s.replace(new RegExp('(' + name + ':\\\\s*\")0x[a-fA-F0-9]+(\" as Address)'), '\$1' + addr + '\$2');
};
replace('EURS','$EURS');
replace('ComplianceRegistry','$REGISTRY');
replace('CarbonCredit','$CREDIT');
replace('Retirement','$RETIREMENT');
replace('CarbonDEX','$DEX');
replace('Regulator','$REGULATOR');
fs.writeFileSync('$WEB_TS', s);
"
echo "✓ web/lib/contracts.ts updated"

echo ""
echo "─── Phase 4: Commit + push ───"
git add "$ADDR_JSON" "$WEB_TS"
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
