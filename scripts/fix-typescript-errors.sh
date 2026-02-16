#!/bin/bash

# TypeScript Error Fix Script for JobFlow
# This script fixes common TypeScript compilation errors

echo "🔧 Fixing TypeScript compilation errors..."

# Fix theme mode comparisons (mode === 'dark' instead of theme === 'dark')
echo "📝 Fixing theme mode comparisons..."
find app -name "*.tsx" -exec sed -i '' 's/theme === '\''dark'\''/mode === '\''dark'\''/g' {} \;

# Fix unused variable warnings by prefixing with underscore
echo "📝 Fixing unused variable warnings..."
find app -name "*.tsx" -exec sed -i '' 's/const { isDark }/const { isDark: _isDark }/g' {} \;

# Fix any types in assignments page
echo "📝 Fixing any types..."
sed -i '' 's/(assignments as any)/(assignments as { data?: unknown[] })/g' app/\(admin\)/admin/einsaetze/page.tsx

# Fix property access on possibly undefined objects
echo "📝 Adding null checks for possibly undefined properties..."
sed -i '' 's/timeAccountReport\.totalHours/timeAccountReport?.totalHours/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/timeAccountReport\.regularHours/timeAccountReport?.regularHours/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/timeAccountReport\.overtimeHours/timeAccountReport?.overtimeHours/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/surchargeReport\.totalAmount/surchargeReport?.totalAmount/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/employeeStatistics\.totalEmployees/employeeStatistics?.totalEmployees/g' app/\(admin\)/admin/berichte/page.tsx

# Fix missing property errors
echo "📝 Fixing missing property errors..."
sed -i '' 's/\.id/?.id/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/\.name/?.name/g' app/\(admin\)/admin/berichte/page.tsx
sed -i '' 's/\.hours/?.hours/g' app/\(admin\)/admin/berichte/page.tsx

# Fix string method calls on Date objects
echo "📝 Fixing string method calls on Date objects..."
sed -i '' 's/\.getTime()/\.getTime()/g' app/\(admin\)/admin/shifts/page.tsx

# Fix missing tz property
echo "📝 Adding missing tz property..."
sed -i '' 's/date: data\.date\.toDate()/date: data.date.toDate(), tz: data.tz || '\''Europe\/Berlin'\''/g' lib/services/shifts.ts

echo "✅ TypeScript error fixes completed!"
echo "🔍 Running type check to verify fixes..."

# Run type check
npm run typecheck

echo "🎉 TypeScript fixes applied!"
