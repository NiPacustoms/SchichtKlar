#!/bin/bash

# Service Error Handling Update Script
# This script updates all service files to use the new error handling system

echo "🔧 Updating service files with standardized error handling..."

# List of service files to update
SERVICE_FILES=(
  "lib/services/assignments.ts"
  "lib/services/timesheets.ts"
  "lib/services/authService.ts"
  "lib/services/staffGroups.ts"
  "lib/services/firestoreService.ts"
  "lib/services/employeeReports.ts"
  "lib/services/employeeNotifications.ts"
  "lib/services/employeeFacilities.ts"
  "lib/services/adminSettings.ts"
  "lib/services/adminChat.ts"
  "lib/services/times.ts"
  "lib/services/settings.ts"
  "lib/services/reports.ts"
  "lib/services/facilities.ts"
  "lib/services/documents.ts"
  "lib/services/shifts.ts"
  "lib/services/users.ts"
  "lib/services/exportService.ts"
  "lib/services/notifications.ts"
  "lib/services/messages.ts"
)

# Function to update a service file
update_service_file() {
  local file="$1"
  local service_name=$(basename "$file" .ts)
  
  echo "📝 Updating $file..."
  
  # Add error handling imports if not present
  if ! grep -q "import.*errorHandler.*from.*@/lib/errors" "$file"; then
    sed -i '' '1a\
import { errorHandler, logger } from '\''@/lib/errors'\'';
' "$file"
  fi
  
  # Replace console.error with logger.error
  sed -i '' 's/console\.error(/logger.error(/g' "$file"
  sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
  sed -i '' 's/console\.log(/logger.info(/g' "$file"
  
  # Replace throw error with proper error handling
  sed -i '' 's/} catch (error) {$/} catch (error) {\
      const appError = errorHandler.handleFirebaseError(error, {\
        component: '\''"$service_name"'\'',\
        action: '\''function_name'\''\
      });\
      logger.error('\''Failed to execute function'\'', appError);\
      throw appError;\
    }/g' "$file"
  
  # Replace simple throw error with proper error handling
  sed -i '' 's/throw error;/const appError = errorHandler.handleError(error, {\
        component: '\''"$service_name"'\''\
      });\
      logger.error('\''Error occurred'\'', appError);\
      throw appError;/g' "$file"
}

# Update all service files
for file in "${SERVICE_FILES[@]}"; do
  if [ -f "$file" ]; then
    update_service_file "$file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✅ Service error handling updates completed!"
echo "🔍 Running type check to verify updates..."

# Run type check
npm run typecheck

echo "🎉 Service error handling updates applied!"
