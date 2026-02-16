const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    console.log('   Please create .env.local with your Firebase credentials');
    console.log('   See ENV_EXAMPLE.md for template');
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
  console.log(`   Mock Auth: ${mockAuth ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`   Mock Data: ${mockData ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`   Realtime: ${realtime ? '✅ ENABLED' : '❌ DISABLED'}`);
  
  // Production validation
  if (process.env.NODE_ENV === 'production') {
    if (mockAuth || mockData) {
      console.error('❌ Production mode with Mock features is not allowed');
      console.log('   Please disable mock features for production');
      process.exit(1);
    }
    console.log('✅ Production configuration valid');
  }
  
  // Feature flag consistency check
  if (!mockAuth && mockData) {
    console.warn('⚠️  Warning: Real Auth with Mock Data may cause issues');
  }
  
  if (!mockAuth && !mockData && !realtime) {
    console.warn('⚠️  Warning: All features disabled - app may not work properly');
  }
  
  console.log('');
  console.log('🎯 Migration Status:');
  if (mockAuth && mockData && !realtime) {
    console.log('   📱 Development Mode (Mock)');
  } else if (!mockAuth && !mockData && realtime) {
    console.log('   🚀 Production Mode (Full Migration)');
  } else {
    console.log('   🔄 Partial Migration');
  }
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
