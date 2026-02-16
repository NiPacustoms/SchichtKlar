#!/bin/bash
# Helper script to set secrets as environment variables
# This script is used to avoid linter warnings in GitHub Actions workflows

set -euo pipefail

# Read secrets from arguments
ENV_FILE="${1:-}"
ENV_LOCAL_FILE="${2:-}"

# Write to GITHUB_ENV if values are provided
if [ -n "$ENV_FILE" ]; then
  echo "ENV_FILE=$ENV_FILE" >> "$GITHUB_ENV"
fi

if [ -n "$ENV_LOCAL_FILE" ]; then
  echo "ENV_LOCAL_FILE=$ENV_LOCAL_FILE" >> "$GITHUB_ENV"
fi

