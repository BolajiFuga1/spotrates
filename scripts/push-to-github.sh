#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! gh auth status &>/dev/null; then
  echo "Not logged into GitHub. Run this once in Terminal (browser will open):"
  echo "  gh auth login -h github.com -p https -w"
  exit 1
fi

NAME="${1:-spotrates}"
if git remote get-url origin &>/dev/null; then
  echo "Remote 'origin' already exists. Pushing to it..."
  git push -u origin main
  gh repo view --web 2>/dev/null || true
  exit 0
fi

echo "Creating github.com/$(gh api user -q .login)/${NAME} and pushing..."
gh repo create "$NAME" --public --source=. --remote=origin --push --description "SpotRates — USD, NGN, GBP, EUR board + admin"
echo "Done. Repo: https://github.com/$(gh api user -q .login)/${NAME}"
echo ""
echo "Next — Render (free URL):"
echo "  1. https://dashboard.render.com → New → Blueprint"
echo "  2. Pick this repo; confirm build: npm install && npm run build, start: npm start"
echo "  3. Environment: ADMIN_PASSWORD, SPOTRATES_ADMIN_AUTH=1, COOKIE_SECURE=1, SESSION_SECRET"
