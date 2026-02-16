#!/usr/bin/env bash
# Ermittelt den Git-Commit, der zuletzt erfolgreich auf Production (Firebase Hosting) deployed wurde.
# Nutzung: ./scripts/get-deployed-commit.sh
# Dann: git fetch origin && git checkout <ausgegebene-SHA>
#
# Optional: GITHUB_TOKEN setzen für private Repos oder höheres Rate-Limit.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Kein Git-Repository." >&2
  exit 1
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "$REMOTE_URL" ]; then
  echo "Kein Remote 'origin' gefunden." >&2
  exit 1
fi

# owner/repo aus URL extrahieren (https://github.com/owner/repo oder git@github.com:owner/repo.git)
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]%.git}"
else
  echo "Konnte Owner/Repo nicht aus origin auslesen: $REMOTE_URL" >&2
  exit 1
fi

WORKFLOW_FILE="firebase-hosting.yml"
URL="https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?branch=main&status=success&per_page=1"

CURL_OPTS=(-sS -f)
if [ -n "$GITHUB_TOKEN" ]; then
  CURL_OPTS+=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

RESPONSE="$(curl "${CURL_OPTS[@]}" "$URL" 2>/dev/null)" || true
if [ -z "$RESPONSE" ]; then
  echo "GitHub API nicht erreichbar oder fehlgeschlagen. Für private Repos: GITHUB_TOKEN setzen." >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  SHA="$(echo "$RESPONSE" | jq -r '.workflow_runs[0].head_sha // empty')"
else
  SHA="$(echo "$RESPONSE" | grep -o '"head_sha": *"[a-f0-9]*"' | head -1 | sed 's/.*"\([a-f0-9]*\)"$/\1/')"
fi

if [ -z "$SHA" ]; then
  echo "Kein erfolgreicher Production-Run für main gefunden (Workflow: Deploy to Firebase Hosting)." >&2
  exit 1
fi

echo "$SHA"
echo "# Letzter erfolgreicher Production-Deploy (main). Checkout mit: git fetch origin && git checkout $SHA" >&2

# Optional: Direkt auschecken, wenn CHECKOUT=1 gesetzt ist
if [ "${CHECKOUT}" = "1" ]; then
  echo "Checkout des deployten Commits..." >&2
  git fetch origin
  git checkout "$SHA"
  echo "Erfolgreich auf $SHA (veröffentlichte Web-App-Version) gewechselt." >&2
fi
