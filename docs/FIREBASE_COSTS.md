# Firebase Hosting Kostenübersicht - JobFlow

## Konfiguration

- **Projekt:** jobflow25
- **Region:** europe-west1 (Belgien)
- **Tarif:** Blaze Plan (Pay-as-you-go)
- **Hosting:** Firebase Hosting mit Next.js SSR
- **Backend:** Cloud Functions (Generation 2, läuft auf Cloud Run)

## Kostenaufteilung

### ✅ Kostenlos (bis zu bestimmten Limits)

1. **Firebase Hosting**
   - ✅ Hosting kostenlos
   - ✅ SSL-Zertifikate kostenlos
   - ✅ CDN inklusive
   - ✅ 10 GB Storage kostenlos pro Monat
   - ✅ 360 MB/Day Transfer kostenlos

2. **Firestore Database**
   - ✅ 50.000 Reads/Day kostenlos
   - ✅ 20.000 Writes/Day kostenlos
   - ✅ 20.000 Deletes/Day kostenlos

3. **Firebase Authentication**
   - ✅ Unbegrenzt kostenlos

4. **Cloud Storage**
   - ✅ 5 GB Storage kostenlos
   - ✅ 1 GB Transfer/Day kostenlos

### 💰 Kostenpflichtig (Pay-as-you-go)

#### 1. Cloud Functions (Next.js SSR)

**Kostenkomponenten:**

**a) Invocations (Funktionsaufrufe)**

- Erste 2 Millionen Invocations/Monat: **Kostenlos**
- Danach: **$0,40 pro 1 Million Invocations**
- Deine SSR-Function wird bei jedem Page Request aufgerufen

**b) Compute Time (Ausführungszeit)**

- Gemessen in: **GB-Sekunden**
- Berechnung: `Memory (GB) × Execution Time (Sekunden) × Anzahl Invocations`
- Standard Memory: **512 MB** (0,5 GB)
- Standard Timeout: **60 Sekunden**

**Preise in europe-west1:**

- Erste 400.000 GB-Sekunden/Monat: **Kostenlos**
- 400.001 - 800.000 GB-Sekunden: **$0,0000025 pro GB-Sekunde**
- Über 800.000 GB-Sekunden: **$0,00000125 pro GB-Sekunde**

**c) Netzwerk (Egress)**

- Erste 5 GB/Monat: **Kostenlos** (nur egress aus Google)
- Danach: **$0,12 pro GB** (intern EU-EU)
- $0,12 pro GB (extern, erste 10 TB)

**Beispielrechnung für typische Nutzung:**

**Szenario 1: Klein (1000 Page Views/Tag = ~30.000/Monat)**

```
Invocations: 30.000 (kostenlos, unter 2M Limit)
Compute Time: 30.000 × 0,5 GB × 2 Sekunden = 30.000 GB-Sekunden (kostenlos, unter 400k)
Netzwerk: ~5 GB (kostenlos)

Kosten: $0/Monat
```

**Szenario 2: Mittel (10.000 Page Views/Tag = ~300.000/Monat)**

```
Invocations: 300.000 (kostenlos, unter 2M Limit)
Compute Time: 300.000 × 0,5 GB × 2 Sekunden = 300.000 GB-Sekunden (kostenlos, unter 400k)
Netzwerk: ~50 GB = 45 GB kostenpflichtig → $0,12 × 45 = $5,40

Kosten: ~$5-6/Monat
```

**Szenario 3: Groß (100.000 Page Views/Tag = ~3M/Monat)**

```
Invocations: 3.000.000 = 1M kostenpflichtig → $0,40
Compute Time: 3M × 0,5 GB × 2 Sekunden = 3M GB-Sekunden
  - Erste 400k: kostenlos
  - 400k-800k: 400k × $0,0000025 = $1,00
  - Über 800k: 2,2M × $0,00000125 = $2,75
  - Total Compute: $3,75
Netzwerk: ~500 GB = 495 GB kostenpflichtig → $0,12 × 495 = $59,40

Kosten: ~$63-65/Monat
```

#### 2. Firestore (falls Limits überschritten)

**Preise in europe-west1:**

- Reads: **$0,06 pro 100.000** (nach Free Tier)
- Writes: **$0,18 pro 100.000** (nach Free Tier)
- Deletes: **$0,02 pro 100.000** (nach Free Tier)
- Storage: **$0,18 pro GB/Monat** (nach 1 GB Free Tier)

#### 3. Cloud Storage (falls Limits überschritten)

**Preise:**

- Storage: **$0,020 pro GB/Monat** (nach 5 GB Free)
- Netzwerk Egress: **$0,12 pro GB** (nach 1 GB/Day Free)

## Kostenoptimierung

### 1. Statische Seiten (ISR/SSG)

- Nutze statische Generierung wo möglich
- Reduziert Cloud Function Invocations
- **Kostenersparnis:** Bis zu 80% bei statischen Seiten

### 2. Caching

- Nutze Firebase Hosting CDN
- Statische Assets werden automatisch gecacht
- **Kostenersparnis:** Reduziert Netzwerk-Egress

### 3. Memory & Timeout optimieren

- Aktuell: 512 MB Memory, 60s Timeout (Default)
- Für schnelle SSR-Responses: 256 MB reicht oft
- **Kostenersparnis:** 50% weniger Compute-Kosten

### 4. Min Instances

- Standard: 0 (Cold Start)
- Bei konstantem Traffic: 1 Min Instance
- **Kosten:** ~$10-15/Monat für 1 Instance, aber kein Cold Start

### 5. Max Instances limitieren

- Standard: Unbegrenzt
- Setze Max Instances basierend auf erwartetem Traffic
- **Kostenersparnis:** Verhindert unerwartete Kosten bei Traffic-Spikes

## Monitoring & Budgets

### Kostenüberwachung einrichten:

```bash
# Budget-Alarm erstellen
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="JobFlow Monthly Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Kosten-Dashboard:

- Google Cloud Console → Billing → Reports
- Firebase Console → Usage and billing

## Geschätzte Kosten (realistisch)

**Startup/Entwicklung:**

- ~1.000-5.000 Page Views/Monat
- **Kosten: $0-5/Monat**

**Kleines Team (10-50 Nutzer):**

- ~50.000-100.000 Page Views/Monat
- **Kosten: $10-25/Monat**

**Wachsendes Business (100-500 Nutzer):**

- ~500.000-1M Page Views/Monat
- **Kosten: $30-60/Monat**

**Enterprise (1000+ Nutzer):**

- ~5M+ Page Views/Monat
- **Kosten: $100-300/Monat** (je nach Optimierung)

## Wichtige Hinweise

1. **Free Tier Credits:**
   - Google gibt neue Kunden oft $300 Free Credits für 90 Tage
   - Prüfe dein Billing-Konto

2. **Kostenexplosion vermeiden:**
   - Setze Budget-Alerts
   - Monitor täglich in den ersten Wochen
   - Nutze `minInstances: 0` wenn möglich

3. **Region Preise:**
   - europe-west1 (Belgien) ist eine günstige Region
   - US-Regionen sind oft teurer

4. **Billing-Transparenz:**
   - Alle Kosten sind in der Google Cloud Console einsehbar
   - Firebase Console zeigt auch Nutzung und geschätzte Kosten

## Nächste Schritte

1. **Kosten überwachen:**

   ```bash
   # Tägliche Kosten-Checks
   gcloud billing accounts list
   ```

2. **Optimierungen implementieren:**
   - Statische Seiten wo möglich
   - Caching nutzen
   - Memory/Timeout optimieren

3. **Budget-Alarm einrichten:**
   - In Google Cloud Console → Billing → Budgets & alerts

## Weitere Informationen

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Cloud Functions Pricing](https://cloud.google.com/functions/pricing)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Firestore Pricing](https://cloud.google.com/firestore/pricing)

---

**Stand:** November 2024
**Region:** europe-west1 (Belgien)
**Tarif:** Blaze Plan (Pay-as-you-go)
