#!/bin/bash

# Code Cleanup Script for JobFlow
# This script performs comprehensive code cleanup including:
# - Replacing console.logs with logger
# - Removing unused imports and variables
# - Fixing ESLint warnings
# - Cleaning up code quality issues

echo "🧹 Starting comprehensive code cleanup..."

# Replace console.log statements with logger
echo "📝 Replacing console.log statements with logger..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  # Replace console.log with logger.info
  sed -i '' 's/console\.log(/logger.info(/g' "$file"
  
  # Replace console.error with logger.error
  sed -i '' 's/console\.error(/logger.error(/g' "$file"
  
  # Replace console.warn with logger.warn
  sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
  
  # Replace console.info with logger.info
  sed -i '' 's/console\.info(/logger.info(/g' "$file"
done

# Add logger import to files that use it
echo "📝 Adding logger imports..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  if grep -q "logger\." "$file" && ! grep -q "import.*logger" "$file"; then
    # Add logger import at the top
    sed -i '' '1i\
import { logger } from '\''@/lib/logging'\'';
' "$file"
  fi
done

# Remove unused imports (basic cleanup)
echo "📝 Removing common unused imports..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  # Remove unused React imports
  if ! grep -q "React\." "$file" && ! grep -q "<.*>" "$file"; then
    sed -i '' '/import React from/d' "$file"
  fi
  
  # Remove unused useState/useEffect imports
  if ! grep -q "useState\|useEffect" "$file"; then
    sed -i '' '/useState\|useEffect/d' "$file"
  fi
done

# Fix common ESLint issues
echo "📝 Fixing common ESLint issues..."

# Fix unused variables by prefixing with underscore
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  # Fix unused destructured variables
  sed -i '' 's/const { \([^}]*\) } = /const { \1: _\1 } = /g' "$file"
done

# Remove empty catch blocks
echo "📝 Removing empty catch blocks..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  # Replace empty catch blocks with proper error handling
  sed -i '' 's/} catch (error) {\s*}/} catch (error) {\
      logger.error('\''Unhandled error'\'', error as Error);\
    }/g' "$file"
done

# Clean up trailing whitespace
echo "📝 Cleaning up trailing whitespace..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  sed -i '' 's/[[:space:]]*$//' "$file"
done

# Remove duplicate imports
echo "📝 Removing duplicate imports..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
  # This is a simplified approach - in practice, you'd want a more sophisticated solution
  awk '!seen[$0]++' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "✅ Code cleanup completed!"
echo "🔍 Running lint check to verify cleanup..."

# Run lint check
npm run lint

echo "🎉 Code cleanup finished!"
