#!/bin/bash
# Einfaches Script zum Setzen der Firebase Berechtigungen
# Nutzt nur die beiden wichtigsten Rollen

PROJECT_ID="schichtklar"
SERVICE_ACCOUNT="schichtklar@schichtklar.iam.gserviceaccount.com"

echo "Setze Berechtigungen für $SERVICE_ACCOUNT..."
echo ""

# 1. Cloud Functions Admin - MUSS vorhanden sein
echo "✅ Füge Cloud Functions Admin hinzu..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.admin"

# 2. Cloud Run Admin - MUSS vorhanden sein
echo "✅ Füge Cloud Run Admin hinzu..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

echo ""
echo "✅ Berechtigungen gesetzt!"
echo "Warte 30 Sekunden für Propagierung..."
sleep 30

echo ""
echo "Aktuelle Berechtigungen:"
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)"

echo ""
echo "Hinweis: Falls das Deployment weiterhin fehlschlägt,"
echo "kannst du temporär auch die 'Editor'-Rolle hinzufügen:"
echo "gcloud projects add-iam-policy-binding $PROJECT_ID --member='serviceAccount:$SERVICE_ACCOUNT' --role='roles/editor'"

