#!/bin/bash
# Update GOOGLE_API_KEY across all Railway agent projects
# Usage: ./scripts/update-google-key.sh YOUR_NEW_KEY

if [ -z "$1" ]; then
  echo "Usage: ./scripts/update-google-key.sh YOUR_NEW_GOOGLE_API_KEY"
  exit 1
fi

NEW_KEY="$1"
WORKSPACE="Quest"

# All projects and their service names
declare -A PROJECTS=(
  ["dionysus-wine-agent"]="dionysus"
  ["aionysus-wine-agent-v3"]="aionysus"
  ["pension-quest-agent"]="pension"
  ["eachwaycalculator-agent"]="eachway"
  ["tractorinsurance-agent"]="tractor"
  ["puppyinsurance-agent"]="puppy"
  ["mortgagecalculator.quest-agent"]="mortgage"
  ["stampdutycalculator.quest-agent"]="stampduty"
  ["relocation-quest-v3-agent"]="relocation"
  ["fractional.quest-agent"]="fractional"
  ["lost.london-agent"]="lost"
  ["gtm.quest-agent"]="gtm"
  ["yogateacherinsurance.quest-agent"]="yoga"
  ["chiefofstaff.quest-agent"]="chief"
  ["membership.quest-agent"]="membership"
  ["gasratecalculator.quest-agent"]="gas"
  ["hitl.quest-agent"]="hitl"
  ["mvp.actor-agent"]="mvp"
  ["deepagent"]="deep"
  ["miam-quest-agent"]="miam"
  ["gtm-quest-agent"]="gtm-quest"
  ["relocation.quest-agent"]="relocation-old"
)

echo "Updating GOOGLE_API_KEY across ${#PROJECTS[@]} Railway projects..."
echo ""

SUCCESS=0
FAILED=0

for PROJECT in "${!PROJECTS[@]}"; do
  SERVICE="${PROJECTS[$PROJECT]}"
  echo -n "  $PROJECT ($SERVICE)... "

  # Link to project+service
  railway link -p "$PROJECT" -w "$WORKSPACE" -s "$SERVICE" -e production 2>/dev/null
  if [ $? -ne 0 ]; then
    # Try without service (some projects may have different service names)
    railway link -p "$PROJECT" -w "$WORKSPACE" -e production 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "SKIP (can't link)"
      ((FAILED++))
      continue
    fi
  fi

  # Set the variable
  railway variables --set "GOOGLE_API_KEY=$NEW_KEY" --skip-deploys 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "OK"
    ((SUCCESS++))
  else
    echo "FAILED"
    ((FAILED++))
  fi
done

echo ""
echo "Done! Updated: $SUCCESS, Failed: $FAILED"
echo ""
echo "Note: Used --skip-deploys to avoid 20+ simultaneous redeploys."
echo "Projects will pick up the new key on their next deploy."
echo "To force redeploy a specific project: railway redeploy"
