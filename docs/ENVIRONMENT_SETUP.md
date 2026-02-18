# JobFlow Environment Configuration

## Development Setup (Mock Mode)

```env
# Firebase Configuration (Development)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Emulator Configuration (Development)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags - DEVELOPMENT (Mock Mode)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REALTIME=false
```

## Staging Setup (Partial Migration)

```env
# Firebase Configuration (Staging)
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_staging_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_staging_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_staging_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id

# Firebase Emulator Configuration (Staging)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.jobflow.app

# Feature Flags - STAGING (Partial Migration)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

## Production Setup (Full Migration)

```env
# Firebase Configuration (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id

# Firebase Emulator Configuration (Production)
NEXT_PUBLIC_USE_EMULATOR=false

# Application Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://jobflow.app

# Feature Flags - PRODUCTION (Full Migration)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true

# Legal/Impressum Configuration (REQUIRED for Production)
NEXT_PUBLIC_COMPANY_NAME=AufAbruf GmbH
NEXT_PUBLIC_LEGAL_FORM=GmbH
NEXT_PUBLIC_COMPANY_STREET=Herner Straße 134
NEXT_PUBLIC_COMPANY_CITY=Herten
NEXT_PUBLIC_COMPANY_ZIP=45699
NEXT_PUBLIC_COMPANY_COUNTRY=Deutschland
NEXT_PUBLIC_COMPANY_EMAIL=info@aufabruf.eu
NEXT_PUBLIC_COMPANY_PHONE=02366 58 292 58
NEXT_PUBLIC_COMPANY_WEBSITE=www.aufabruf.eu

# Register Information
NEXT_PUBLIC_REGISTER_NUMBER=HRB 9754
NEXT_PUBLIC_REGISTER_COURT=Amtsgericht Recklinghausen
NEXT_PUBLIC_VAT_ID=DE369 553 099

# Responsible Person
NEXT_PUBLIC_RESPONSIBLE_NAME=Christian Zak
NEXT_PUBLIC_RESPONSIBLE_POSITION=Geschäftsführer

# Sentry Error Tracking (Optional but recommended)
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Migration Commands

### Development → Staging

```bash
# Copy staging environment
cp .env.local .env.staging

# Update feature flags for staging
sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.staging
sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.staging
sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.staging

# Deploy to staging
npm run deploy:staging
```

### Staging → Production

```bash
# Copy production environment
cp .env.staging .env.production

# Update URLs and project IDs for production
sed -i 's/staging.jobflow.app/jobflow.app/' .env.production
sed -i 's/your_staging_project/your_production_project/' .env.production

# Deploy to production
npm run deploy:production
```

## Quick Migration Script

Create `scripts/migrate-to-production.sh`:

```bash
#!/bin/bash

echo "🚀 JobFlow Migration Script"
echo "=========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it first."
    exit 1
fi

# Backup current environment
cp .env.local .env.backup
echo "✅ Backup created: .env.backup"

# Migration options
echo ""
echo "Select migration target:"
echo "1) Staging (Partial Migration)"
echo "2) Production (Full Migration)"
echo "3) Development (Mock Mode)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔄 Migrating to Staging..."
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Staging migration complete"
        ;;
    2)
        echo "🔄 Migrating to Production..."
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Production migration complete"
        ;;
    3)
        echo "🔄 Reverting to Development..."
        cp .env.backup .env.local
        echo "✅ Development mode restored"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration completed!"
echo "Current feature flags:"
grep "NEXT_PUBLIC_ENABLE" .env.local

echo ""
echo "Next steps:"
echo "1. Test the application"
echo "2. Run: npm run build"
echo "3. Deploy if ready"
```

## Environment Validation

Create `scripts/validate-env.js`:

```javascript
const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_ENABLE_MOCK_AUTH',
    'NEXT_PUBLIC_ENABLE_MOCK_DATA',
    'NEXT_PUBLIC_ENABLE_REALTIME',
  ];

  const missing = requiredVars.filter(varName => !envVars[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Validate feature flags
  const mockAuth = envVars['NEXT_PUBLIC_ENABLE_MOCK_AUTH'] === 'true';
  const mockData = envVars['NEXT_PUBLIC_ENABLE_MOCK_DATA'] === 'true';
  const realtime = envVars['NEXT_PUBLIC_ENABLE_REALTIME'] === 'true';

  console.log('✅ Environment validation passed');
  console.log('📊 Current configuration:');
  console.log(`   Mock Auth: ${mockAuth}`);
  console.log(`   Mock Data: ${mockData}`);
  console.log(`   Realtime: ${realtime}`);

  // Production validation
  if (process.env.NODE_ENV === 'production') {
    if (mockAuth || mockData) {
      console.error('❌ Production mode with Mock features is not allowed');
      process.exit(1);
    }
    console.log('✅ Production configuration valid');
  }
}

validateEnvironment();
```

## Usage Instructions

1. **Create `.env.local`** with your Firebase credentials
2. **Run validation**: `node scripts/validate-env.js`
3. **Migrate**: `bash scripts/migrate-to-production.sh`
4. **Test**: `npm run build && npm run dev`
5. **Deploy**: `npm run deploy:production`

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check Firebase credentials in `.env.local`
   - Verify project ID matches Firebase Console

2. **"Permission denied"**
   - Deploy Firestore Rules: `firebase deploy --only firestore:rules`
   - Check user roles in Firebase Auth

3. **"Mock data still showing"**
   - Verify feature flags: `grep NEXT_PUBLIC_ENABLE .env.local`
   - Restart development server

4. **"Realtime not working"**
   - Check Firestore indexes: `firebase deploy --only firestore:indexes`
   - Verify user authentication

### Support Commands

```bash
# Check current configuration
grep "NEXT_PUBLIC_ENABLE" .env.local

# Reset to development
cp .env.backup .env.local

# Validate environment
node scripts/validate-env.js

# Check Firebase connection
npm run test:firebase
```
