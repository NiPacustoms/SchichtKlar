# Error Handling Guide - JobFlow Application

## Overview

This guide provides comprehensive documentation for the error handling system implemented in the JobFlow application. The system follows State-of-the-Art (SOTA) practices and provides robust error management, user-friendly error messages, and comprehensive monitoring capabilities.

## Architecture

### Error Management System

The error handling system consists of three main components:

1. **Error Types & Classes** (`lib/errors/ErrorTypes.ts`)
2. **Error Handler** (`lib/errors/ErrorHandler.ts`)
3. **Error Logger** (`lib/errors/ErrorLogger.ts`)

### Error Boundary Hierarchy

The application uses a 3-tier error boundary system:

1. **Global Error Boundary** - Catches all unhandled errors
2. **Route Error Boundary** - Catches route-specific errors
3. **Component Error Boundary** - Catches component-level errors

## Error Types

### AppError Base Class

All errors in the application extend the `AppError` base class:

```typescript
import { AppError, ErrorCode, ErrorSeverity } from '@/lib/errors';

// Create a new error
const error = new AppError(
  ErrorCode.VALIDATION_REQUIRED_FIELD,
  'Email field is required',
  ErrorSeverity.WARNING,
  { component: 'UserForm', userId: '123' },
  { retryable: true }
);
```

### Error Codes

The system uses typed error codes for consistent error handling:

```typescript
enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',

  // Network & Service Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Firebase Specific
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',

  // Business Logic
  SHIFT_CONFLICT = 'SHIFT_CONFLICT',
  QUALIFICATION_MISSING = 'QUALIFICATION_MISSING',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  CRITICAL = 'critical', // System-breaking errors
  ERROR = 'error', // User-facing errors
  WARNING = 'warning', // Warnings
  INFO = 'info', // Informational messages
}
```

## Error Handling Patterns

### Service Layer Error Handling

All service methods should use the error handler for consistent error processing:

```typescript
import { errorHandler, logger } from '@/lib/errors';

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) return null;

      return transformUserData(userDoc.data());
    } catch (error) {
      const appError = errorHandler.handleFirebaseError(error, {
        component: 'userService',
        action: 'getUserById',
      });
      logger.error('Failed to get user by ID', appError, {
        userId: id,
      });
      throw appError;
    }
  },
};
```

### Component Error Handling

Use error boundaries and the error display components:

```typescript
import { ErrorDisplay, ComponentErrorBoundary } from '@/components/errors';

function UserProfile({ userId }: { userId: string }) {
  return (
    <ComponentErrorBoundary component="UserProfile">
      <UserProfileContent userId={userId} />
    </ComponentErrorBoundary>
  );
}

// Or use the hook for programmatic error handling
function UserForm() {
  const { captureError } = useErrorBoundary();

  const handleSubmit = async (data: FormData) => {
    try {
      await userService.updateUser(data);
    } catch (error) {
      captureError(error);
    }
  };
}
```

### Toast Messages

Use the toast manager for user notifications:

```typescript
import { useToastManager } from '@/components/errors';

function UserActions() {
  const { showSuccess, showError, showAppError } = useToastManager();

  const handleSave = async () => {
    try {
      await userService.saveUser();
      showSuccess('Benutzer erfolgreich gespeichert!');
    } catch (error) {
      if (error instanceof AppError) {
        showAppError(error);
      } else {
        showError('Fehler beim Speichern des Benutzers');
      }
    }
  };
}
```

## Error Boundaries

### Global Error Boundary

Wrap your entire application:

```typescript
import { GlobalErrorBoundary } from '@/components/errors';

function App() {
  return (
    <GlobalErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.error('Global error:', error, errorInfo);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </GlobalErrorBoundary>
  );
}
```

### Route Error Boundary

Wrap individual routes:

```typescript
import { RouteErrorBoundary } from '@/components/errors';

function UserRoute() {
  return (
    <RouteErrorBoundary route="/users">
      <UserPage />
    </RouteErrorBoundary>
  );
}
```

### Component Error Boundary

Wrap individual components:

```typescript
import { ComponentErrorBoundary } from '@/components/errors';

function UserCard({ user }: { user: User }) {
  return (
    <ComponentErrorBoundary component="UserCard">
      <UserCardContent user={user} />
    </ComponentErrorBoundary>
  );
}
```

## Logging

### Structured Logging

Use the logger for consistent logging:

```typescript
import { logger } from '@/lib/errors';

// Different log levels
logger.debug('Debug message', { component: 'UserService' });
logger.info('User action completed', { userId: '123', action: 'login' });
logger.warn('Deprecated API used', { api: 'old-endpoint' });
logger.error('Operation failed', error, { component: 'UserService' });
logger.critical('System failure', error, { component: 'Database' });

// Performance logging
logger.performance('Database query', 150, { query: 'getUsers' });

// User action logging
logger.userAction('user_login', { userId: '123' });

// API request logging
logger.apiRequest('GET', '/api/users', 200, 120, { userId: '123' });
```

### Component-Specific Logging

Create component-specific loggers:

```typescript
import { LogUtils } from '@/lib/errors';

const userLogger = LogUtils.createComponentLogger('UserService');

userLogger.info('User created', { userId: '123' });
userLogger.error('User creation failed', error, { userData: data });
```

## Error Recovery

### Retry Mechanisms

The error handler provides built-in retry logic:

```typescript
import { errorHandler } from '@/lib/errors';

// Execute with retry
const result = await errorHandler.executeWithRetry(
  () => userService.getUser(id),
  { component: 'UserComponent' },
  { maxRetries: 3 }
);
```

### Manual Retry

Provide manual retry options in UI:

```typescript
import { ErrorDisplay } from '@/components/errors';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const loadUser = async () => {
    try {
      const userData = await userService.getUser(userId);
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err as AppError);
    }
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        retry={loadUser}
        variant="card"
      />
    );
  }

  return <UserProfileContent user={user} />;
}
```

## Best Practices

### 1. Error Handling in Services

✅ **Do:**

```typescript
try {
  const result = await firebaseOperation();
  return result;
} catch (error) {
  const appError = errorHandler.handleFirebaseError(error, {
    component: 'serviceName',
    action: 'methodName',
  });
  logger.error('Operation failed', appError);
  throw appError;
}
```

❌ **Don't:**

```typescript
try {
  const result = await firebaseOperation();
  return result;
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

### 2. Component Error Handling

✅ **Do:**

```typescript
function MyComponent() {
  const { captureError } = useErrorBoundary();

  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      captureError(error);
    }
  };
}
```

❌ **Don't:**

```typescript
function MyComponent() {
  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      console.error('Error:', error);
      // Error propagates and crashes the app
    }
  };
}
```

### 3. User Feedback

✅ **Do:**

```typescript
const { showSuccess, showError } = useToastManager();

try {
  await saveData();
  showSuccess('Daten erfolgreich gespeichert!');
} catch (error) {
  showError('Fehler beim Speichern der Daten');
}
```

❌ **Don't:**

```typescript
try {
  await saveData();
  alert('Success!');
} catch (error) {
  alert('Error!');
}
```

## Testing Error Scenarios

### Error Boundary Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentErrorBoundary } from '@/components/errors';

const ThrowError = () => {
  throw new Error('Test error');
};

test('Error boundary catches errors', () => {
  render(
    <ComponentErrorBoundary component="TestComponent">
      <ThrowError />
    </ComponentErrorBoundary>
  );

  expect(screen.getByText('Komponentenfehler')).toBeInTheDocument();
});
```

### Service Error Testing

```typescript
import { errorHandler } from '@/lib/errors';

test('Service handles Firebase errors', async () => {
  const mockError = { code: 'permission-denied', message: 'Access denied' };

  try {
    await userService.getUser('invalid-id');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('FIREBASE_PERMISSION_DENIED');
  }
});
```

## Monitoring and Analytics

### Error Reporting

The system is prepared for external error reporting services:

```typescript
// Sentry integration (feature-flagged)
if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true') {
  Sentry.captureException(error, {
    extra: errorReport,
    tags: {
      component: error.context.component,
      severity: error.severity,
    },
  });
}
```

### Error Metrics

Track error metrics for monitoring:

```typescript
// Error rates per route
logger.error('Route error', error, {
  route: '/users',
  errorRate: calculateErrorRate(),
});

// Performance impact
logger.performance('Error recovery', recoveryTime, {
  errorType: error.code,
  recoveryMethod: 'retry',
});
```

## Troubleshooting

### Common Issues

1. **Error not caught by boundary**
   - Ensure error is thrown, not returned
   - Check if component is wrapped in boundary

2. **Error messages not in German**
   - Use `AppError` with proper error codes
   - Check error code mapping in `ErrorTypes.ts`

3. **Logs not appearing**
   - Check log level configuration
   - Ensure logger is imported correctly

4. **Retry not working**
   - Check if error is retryable
   - Verify retry configuration

### Debug Mode

Enable debug mode for detailed error information:

```typescript
// In development
const logger = Logger.getInstance({
  logLevel: LogLevel.DEBUG,
  enableConsoleLogging: true,
});
```

## Migration Guide

### From Old Error Handling

1. **Replace console.error:**

   ```typescript
   // Old
   console.error('Error:', error);

   // New
   logger.error('Operation failed', error, { component: 'ServiceName' });
   ```

2. **Replace throw error:**

   ```typescript
   // Old
   throw error;

   // New
   const appError = errorHandler.handleError(error);
   throw appError;
   ```

3. **Add error boundaries:**

   ```typescript
   // Old
   <MyComponent />

   // New
   <ComponentErrorBoundary component="MyComponent">
     <MyComponent />
   </ComponentErrorBoundary>
   ```

## Conclusion

The JobFlow error handling system provides:

- **Robust Error Management**: Centralized, typed, and consistent
- **User-Friendly Experience**: Clear messages and recovery options
- **Developer Experience**: Structured logging and debugging tools
- **Production Readiness**: Monitoring and analytics integration
- **Maintainability**: Consistent patterns and best practices

Follow this guide to implement proper error handling throughout the application and maintain high code quality and user experience standards.

---

**Last Updated**: $(date)
**Version**: 1.0
**Status**: Production Ready
