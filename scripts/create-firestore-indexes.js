#!/usr/bin/env node

/**
 * Script to create Firestore indexes programmatically
 * This script helps create the required indexes for the JobFlow application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Creating Firestore indexes for JobFlow...\n');

// Check if firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Firebase CLI is not installed. Please install it first:');
  console.error('   npm install -g firebase-tools');
  console.error('   firebase login');
  process.exit(1);
}

// Check if firebase project is initialized
if (!fs.existsSync('firebase.json')) {
  console.error('❌ Firebase project not initialized. Please run:');
  console.error('   firebase init firestore');
  process.exit(1);
}

// Check if indexes file exists
if (!fs.existsSync('firestore.indexes.json')) {
  console.error('❌ firestore.indexes.json not found. Please create it first.');
  process.exit(1);
}

try {
  console.log('📋 Deploying Firestore indexes...');
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('\n✅ Firestore indexes deployed successfully!');
  console.log('\n📝 Note: Index creation may take a few minutes to complete.');
  console.log('   You can monitor the progress in the Firebase Console:');
  console.log('   https://console.firebase.google.com/project/jobflow25/firestore/indexes');
} catch (error) {
  console.error('\n❌ Failed to deploy indexes:', error.message);
  console.error('\n🔧 Manual setup required:');
  console.error('   1. Go to Firebase Console');
  console.error('   2. Navigate to Firestore > Indexes');
  console.error('   3. Create the indexes manually using the provided links');
  process.exit(1);
}
