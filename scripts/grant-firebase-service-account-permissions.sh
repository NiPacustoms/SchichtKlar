#!/bin/bash
# Script zum Setzen der Firebase Service Account Berechtigungen
# Verwendung: ./scripts/grant-firebase-service-account-permissions.sh

PROJECT_ID="schichtklar"
SERVICE_ACCOUNT="schichtklar@schichtklar.iam.gserviceaccount.com"

echo "Granting permissions to $SERVICE_ACCOUNT in project $PROJECT_ID..."

# Cloud Functions Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.admin"

# Cloud Run Admin (benötigt für SSR Functions)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

# Service Account User (benötigt zum Erstellen/Verwalten von Functions)
# Alternative Namen in der Console: "Service Account User" oder "Service Account Token Creator"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser" || \
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountTokenCreator"

# Cloud Build Service Account (optional, kann helfen)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudbuild.builds.editor"

# Container Service Account Admin (für Edge Runtime/Container-basierte Functions)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountAdmin"

# Artifact Registry Reader (für Container Images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.reader"

echo "Done! Permissions granted. Waiting 30 seconds for propagation..."
sleep 30

echo "Verifying permissions..."
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)"

