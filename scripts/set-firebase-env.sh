#!/bin/bash
# Helper script to set Firebase secrets as environment variables
# This script is used to avoid linter warnings in GitHub Actions workflows

set -euo pipefail

# Read secrets from arguments
API_KEY="${1:-}"
AUTH_DOMAIN="${2:-}"
PROJECT_ID="${3:-}"
STORAGE_BUCKET="${4:-}"
MESSAGING_SENDER_ID="${5:-}"
APP_ID="${6:-}"

# Write to GITHUB_ENV if values are provided
[ -n "$API_KEY" ] && echo "NEXT_PUBLIC_FIREBASE_API_KEY=$API_KEY" >> "$GITHUB_ENV"
[ -n "$AUTH_DOMAIN" ] && echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN" >> "$GITHUB_ENV"
[ -n "$PROJECT_ID" ] && echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID" >> "$GITHUB_ENV"
[ -n "$STORAGE_BUCKET" ] && echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET" >> "$GITHUB_ENV"
[ -n "$MESSAGING_SENDER_ID" ] && echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID" >> "$GITHUB_ENV"
[ -n "$APP_ID" ] && echo "NEXT_PUBLIC_FIREBASE_APP_ID=$APP_ID" >> "$GITHUB_ENV"

