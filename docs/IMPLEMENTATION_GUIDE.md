# Schichtklar - Implementation Guide: Mock → Production

## Quick Start Guide

### Step 1: Environment Setup (15 Min)

1. **Firebase Konfiguration erstellen**:

```bash
# .env.local erstellen
cp ENV_EXAMPLE.md .env.local
```

2. **Firebase Credentials eintragen**:

- Gehe zu Firebase Console → Project Settings → General
- Kopiere die Web App Configuration
- Füge die Werte in `.env.local` ein

3. **Feature Flags konfigurieren**:

```env
# Development: Mock-Modus
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REALTIME=false

# Production: Scharfschaltung
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### Step 2: Feature Flags Implementation (30 Min)

**Neue Datei erstellen**: `lib/config/featureFlags.ts`

```typescript
/**
 * Feature Flags für schrittweise Migration von Mock zu Production
 */
export const FEATURE_FLAGS = {
  // Auth Configuration
  USE_MOCK_AUTH: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true',

  // Data Configuration
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',

  // Realtime Updates
  USE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',

  // Environment
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Type-safe Feature Flag Check
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

// Log current configuration (Development only)
if (FEATURE_FLAGS.IS_DEVELOPMENT && typeof window !== 'undefined') {
  console.group('🚀 Schichtklar Feature Flags');
  console.log('Mock Auth:', FEATURE_FLAGS.USE_MOCK_AUTH);
  console.log('Mock Data:', FEATURE_FLAGS.USE_MOCK_DATA);
  console.log('Realtime:', FEATURE_FLAGS.USE_REALTIME);
  console.groupEnd();
}
```

### Step 3: Auth Context Migration (1-2 Stunden)

**Datei**: `contexts/AuthContext.tsx`

**Änderung 1**: Feature Flags importieren

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
```

**Änderung 2**: useEffect anpassen (Zeile 24-103)

```typescript
useEffect(() => {
  // === MOCK MODE (Development) ===
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'nurse@schichtklar.de',
      displayName: 'Pflegekraft Benutzer',
      role: 'nurse',
      active: true,
      phone: '+49 123 456789',
      qualifications: ['Krankenpfleger', 'Intensivpflege'],
      vacationDays: 25,
      usedVacationDays: 5,
      documents: [],
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTimeout(() => {
      setUser(mockUser);
      setFirebaseUser(null);
      setLoading(false);
    }, 500);

    return;
  }

  // === PRODUCTION MODE (Firebase Auth) ===
  const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
    setFirebaseUser(firebaseUser);

    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Get custom claims for role
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = idTokenResult.claims.role || userData.role || 'nurse';

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || userData.displayName || '',
            role: role as 'nurse' | 'admin' | 'dispatcher',
            active: userData.active !== undefined ? userData.active : true,
            phone: userData.phone || '',
            qualifications: userData.qualifications || [],
            vacationDays: userData.vacationDays || 25,
            usedVacationDays: userData.usedVacationDays || 0,
            documents: userData.documents || [],
            notificationSettings: userData.notificationSettings || {
              emailNotifications: true,
              pushNotifications: true,
              shiftReminders: true,
              documentExpiry: true,
              systemAnnouncements: true,
            },
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        } else {
          // User document doesn't exist - create basic profile
          console.warn('User document not found, creating basic profile');
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

**Änderung 3**: signIn/signOut Funktionen anpassen

```typescript
const signIn = async (email: string, password: string) => {
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    // Mock-Login - immer erfolgreich
    return Promise.resolve();
  }

  // Real Firebase Auth
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(error.message || 'Login fehlgeschlagen');
  }
};

const signOutUser = async () => {
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    setUser(null);
    setFirebaseUser(null);
    return Promise.resolve();
  }

  // Real Firebase Auth
  try {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  } catch (error: any) {
    throw new Error(error.message || 'Logout fehlgeschlagen');
  }
};
```

### Step 4: Dashboard Hooks Migration (2-3 Stunden)

**Datei**: `lib/hooks/useDashboard.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { assignmentService } from '@/lib/services/assignments';
import { timesheetService } from '@/lib/services/timesheets';

export const useDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // Today's Assignment
  const { data: todayAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['dashboard', 'todayAssignment', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-assignment-1',
          userId: userId,
          shiftId: 'mock-shift-1',
          status: 'accepted' as const,
          assignedAt: new Date(),
          acceptedAt: new Date(),
          notes: 'Frühschicht - Station 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return assignmentService.getTodayAssignment(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Today's Timesheet
  const { data: todayTimesheet, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['dashboard', 'todayTimesheet', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-timesheet-1',
          userId: userId,
          date: new Date(),
          startTime: '06:00',
          endTime: '14:00',
          breakMinutes: 30,
          totalHours: 7.5,
          startDate: new Date(),
          endDate: new Date(),
          notes: 'Frühschicht',
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return timesheetService.getTodayTimesheet(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Recent Timesheets
  const { data: recentTimesheets, isLoading: loadingTimesheets } = useQuery({
    queryKey: ['dashboard', 'recentTimesheets', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (7 days)
        const mockTimesheets = [];
        for (let i = 0; i < 7; i++) {
          const date = subDays(new Date(), i);
          mockTimesheets.push({
            id: `mock-timesheet-${i}`,
            userId: userId,
            date: date,
            startTime: '08:00',
            endTime: '16:00',
            breakMinutes: 30,
            totalHours: 7.5,
            startDate: date,
            endDate: date,
            notes: `Mock timesheet ${i}`,
            status: 'draft' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockTimesheets;
      }

      // Real Firebase Query
      return timesheetService.getRecentTimesheets(userId, 7);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  // Upcoming Assignments
  const { data: upcomingAssignments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['dashboard', 'upcomingAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (3 upcoming)
        const mockAssignments = [];
        for (let i = 1; i <= 3; i++) {
          const date = addDays(new Date(), i);
          mockAssignments.push({
            id: `mock-upcoming-${i}`,
            userId: userId,
            shiftId: `mock-shift-${i}`,
            status: 'pending' as const,
            assignedAt: new Date(),
            notes: `Schicht ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockAssignments;
      }

      // Real Firebase Query
      return assignmentService.getUpcomingAssignments(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Rest of the hook stays the same...
};
```

### Step 5: Service Layer Validation

Die Services sind bereits vollständig implementiert! Nur eine Kleinigkeit ergänzen:

**Neue Methoden hinzufügen** (falls noch nicht vorhanden):

**`lib/services/assignments.ts`**:

```typescript
// Add these methods if missing:
async getTodayAssignment(userId: string): Promise<Assignment | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'asc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return this.mapDocToAssignment(doc);
}

async getUpcomingAssignments(userId: string): Promise<Assignment[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', tomorrow),
    where('status', '==', 'pending'),
    orderBy('date', 'asc'),
    limit(5)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToAssignment(doc));
}
```

**`lib/services/timesheets.ts`**:

```typescript
// Add these methods if missing:
async getTodayTimesheet(userId: string): Promise<Timesheet | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'timesheets'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return this.mapDocToTimesheet(doc);
}

async getRecentTimesheets(userId: string, days: number = 7): Promise<Timesheet[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    orderBy('date', 'desc'),
    limit(days)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToTimesheet(doc));
}
```

### Step 6: Realtime Updates Migration (1-2 Stunden)

**Datei**: `lib/hooks/useRealtimeUpdates.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME || !user) {
      // Fallback: Simulated updates
      const simulateUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      };

      const interval = setInterval(simulateUpdate, 60000); // Every 60s
      return () => clearInterval(interval);
    }

    // === PRODUCTION: Real Firestore Listeners ===
    const unsubscribers: Array<() => void> = [];

    // Listen to shifts updates
    const shiftsQuery = query(collection(db, 'shifts'), where('date', '>=', new Date()));
    const unsubShifts = onSnapshot(shiftsQuery, snapshot => {
      console.log('Realtime: Shifts updated');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    });
    unsubscribers.push(unsubShifts);

    // Listen to user's assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('userId', '==', user.id));
    const unsubAssignments = onSnapshot(assignmentsQuery, snapshot => {
      console.log('Realtime: Assignments updated');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    unsubscribers.push(unsubAssignments);

    // Listen to notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsubNotifications = onSnapshot(notificationsQuery, snapshot => {
      console.log('Realtime: Notifications updated');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    unsubscribers.push(unsubNotifications);

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [queryClient, user]);

  return {
    isConnected: FEATURE_FLAGS.USE_REALTIME,
  };
}
```

### Step 7: Testing Strategy

#### Unit Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Integration Tests

```bash
# E2E Tests mit Playwright (falls vorhanden)
npm run test:e2e

# Oder mit Cypress
npm run cypress:open
```

#### Manual Testing Checklist

**Auth Flow**:

- [ ] Login mit echtem User
- [ ] Logout
- [ ] Token Refresh
- [ ] Rollenbasierte Zugriffe

**Dashboard**:

- [ ] Daten laden korrekt
- [ ] KPIs werden angezeigt
- [ ] Keine Mock-Daten sichtbar

**Realtime**:

- [ ] Änderungen werden Live angezeigt
- [ ] Keine Latenz > 2s

### Step 8: Deployment

#### Staging

```bash
# Build für Staging
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false \
NEXT_PUBLIC_ENABLE_MOCK_DATA=false \
NEXT_PUBLIC_ENABLE_REALTIME=true \
npm run build

# Deploy to Staging
npm run deploy:staging
```

#### Production

```bash
# Build für Production
npm run build

# Deploy to Production
npm run deploy:production
```

## Troubleshooting

### Problem: "Auth User not found"

**Lösung**: Custom Claims noch nicht gesetzt

```bash
# Firebase Console → Authentication → User → Custom Claims
{
  "role": "nurse"
}
```

### Problem: "Firestore Permission Denied"

**Lösung**: Rules noch nicht deployed

```bash
firebase deploy --only firestore:rules
```

### Problem: "Too many reads/writes"

**Lösung**: Query Optimization + Caching

- Erhöhe `staleTime` in React Query
- Füge Pagination hinzu
- Nutze Firestore Indexes

## Success Metrics

- [ ] Auth Conversion Rate: 100%
- [ ] Data Accuracy: 100% (keine Mock-Daten)
- [ ] Realtime Latency: < 2s
- [ ] Error Rate: < 1%
- [ ] Firebase Costs: < $50/Monat

## Support

Bei Fragen oder Problemen:

1. Check MIGRATION_PLAN.md
2. Firebase Console Logs prüfen
3. Sentry Error Tracking
4. Team kontaktieren
