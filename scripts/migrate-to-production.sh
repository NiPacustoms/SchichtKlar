#!/bin/bash

echo "🚀 Schichtklar Migration Script"
echo "=========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it first."
    echo "   Copy from ENV_EXAMPLE.md and add your Firebase credentials"
    exit 1
fi

# Backup current environment
cp .env.local .env.backup
echo "✅ Backup created: .env.backup"

# Migration options
echo ""
echo "Select migration target:"
echo "1) Staging (Partial Migration - Auth + Data)"
echo "2) Production (Full Migration - All Features)"
echo "3) Development (Mock Mode - Revert)"
echo "4) Show current configuration"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔄 Migrating to Staging..."
        sed -i '' 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i '' 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i '' 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Staging migration complete"
        echo "   - Firebase Auth: ENABLED"
        echo "   - Firebase Data: ENABLED"
        echo "   - Realtime Updates: ENABLED"
        ;;
    2)
        echo "🔄 Migrating to Production..."
        sed -i '' 's/NEXT_PUBLIC_ENABLE_MOCK_AUTH=true/NEXT_PUBLIC_ENABLE_MOCK_AUTH=false/' .env.local
        sed -i '' 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=true/NEXT_PUBLIC_ENABLE_MOCK_DATA=false/' .env.local
        sed -i '' 's/NEXT_PUBLIC_ENABLE_REALTIME=false/NEXT_PUBLIC_ENABLE_REALTIME=true/' .env.local
        echo "✅ Production migration complete"
        echo "   - Firebase Auth: ENABLED"
        echo "   - Firebase Data: ENABLED"
        echo "   - Realtime Updates: ENABLED"
        ;;
    3)
        echo "🔄 Reverting to Development..."
        cp .env.backup .env.local
        echo "✅ Development mode restored"
        echo "   - Mock Auth: ENABLED"
        echo "   - Mock Data: ENABLED"
        echo "   - Realtime Updates: DISABLED"
        ;;
    4)
        echo "📊 Current configuration:"
        grep "NEXT_PUBLIC_ENABLE" .env.local || echo "   No feature flags found"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration completed!"
echo ""
echo "📊 Current feature flags:"
grep "NEXT_PUBLIC_ENABLE" .env.local

echo ""
echo "📋 Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Build for production: npm run build"
echo "3. Deploy if ready: npm run deploy"
echo ""
echo "🔧 Troubleshooting:"
echo "- Check logs: npm run dev"
echo "- Validate env: node scripts/validate-env.js"
echo "- Reset: cp .env.backup .env.local"
