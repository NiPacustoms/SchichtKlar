#!/bin/bash
# Minimal notwendige Rollen für Firebase Hosting mit Next.js SSR
# Diese Rollen sind die absoluten Minimum-Requirements

PROJECT_ID="schichtklar"
SERVICE_ACCOUNT="schichtklar@schichtklar.iam.gserviceaccount.com"

echo "Granting MINIMAL required permissions to $SERVICE_ACCOUNT..."

# 1. Cloud Functions Admin - MUSS vorhanden sein
echo "Adding Cloud Functions Admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.admin"

# 2. Cloud Run Admin - MUSS vorhanden sein (für SSR Functions)
echo "Adding Cloud Run Admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

# 3. Service Account Token Creator - Alternative zu Service Account User
echo "Adding Service Account Token Creator..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountTokenCreator"

echo ""
echo "✅ Minimal permissions granted!"
echo "Waiting 30 seconds for propagation..."
sleep 30

echo ""
echo "Current permissions for $SERVICE_ACCOUNT:"
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)"

