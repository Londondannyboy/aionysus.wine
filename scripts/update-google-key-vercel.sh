#!/bin/bash
# Update GOOGLE_API_KEY across all Vercel projects
# Usage: ./scripts/update-google-key-vercel.sh YOUR_NEW_KEY

if [ -z "$1" ]; then
  echo "Usage: ./scripts/update-google-key-vercel.sh YOUR_NEW_GOOGLE_API_KEY"
  exit 1
fi

NEW_KEY="$1"
TEMP_DIR="/tmp/vercel-env-update"

# All Vercel projects
PROJECTS=(
  "aionysus.wine"
  "relocation.quest"
  "fractional.quest"
  "englishlad.beer"
  "tractor-insurance"
  "deepagent"
  "tractorinsurance.quest-v2"
  "smallhr.co.uk"
  "bikeinsurance.quest"
  "utilitybillcalculator.quest"
  "rentvsbuycalculator.quest"
  "watermetercalculator.quest"
  "utilites.quest"
  "rfp.quest"
  "creditinsurance.quest"
  "travelinsurance.quest"
  "holidayinsurance.quest"
  "homeinsurance.quest"
  "healthinsurance.quest"
  "energybillcalculator.quest"
  "watersavingcalculator.quest"
  "utilitybillscalculator.quest"
  "motorinsurance.quest"
  "keyperson.quest"
  "mobilityscooterinsurance-quest"
  "miam.quest"
  "gasratecalculator-v2"
  "membership.quest"
  "gtm.quest"
  "eachwaycalculator.quest"
  "pension.quest"
  "yogateacherinsurance.quest"
  "puppyinsurance.quest"
  "mortgagecalculator.quest"
  "stampdutycalculator.quest"
  "mvp.actor"
  "chiefofstaff.quest"
  "parttime.quest"
  "interim.quest"
  "hitl.quest"
  "insulinpumpinsurance.quest"
  "villagefeteinsurance.quest"
  "esportsproduction.quest"
  "esportsevent.quest"
  "esportsnews.quest"
  "kimchi.quest"
  "bestseats.quest"
  "lost-london"
  "lettings.quest"
  "rainmakrr.com"
  "predeploy.ai"
  "rainmakrr.agency"
)

echo "Updating GOOGLE_API_KEY across ${#PROJECTS[@]} Vercel projects..."
echo ""

mkdir -p "$TEMP_DIR"

SUCCESS=0
FAILED=0

for PROJECT in "${PROJECTS[@]}"; do
  echo -n "  $PROJECT... "

  # Link to project
  vercel link --project "$PROJECT" --yes --cwd "$TEMP_DIR" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "SKIP (can't link)"
    ((FAILED++))
    continue
  fi

  # Set for production (printf '%s' avoids trailing newline)
  printf '%s' "$NEW_KEY" | vercel env add GOOGLE_API_KEY production --force --cwd "$TEMP_DIR" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "OK"
    ((SUCCESS++))
  else
    echo "FAILED"
    ((FAILED++))
  fi
done

# Cleanup
rm -rf "$TEMP_DIR/.vercel"

echo ""
echo "Done! Updated: $SUCCESS, Failed: $FAILED"
echo ""
echo "Note: Changes take effect on next deployment."
echo "To force redeploy: vercel --prod --cwd /path/to/project"
