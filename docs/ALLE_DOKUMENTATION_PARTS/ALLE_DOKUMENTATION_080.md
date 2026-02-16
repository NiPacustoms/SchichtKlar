# JobFlow – Dokumentation Teil 80

*Zeichen 1569635–1589514 von 2862906*

---

- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Page-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h4"`
  - `sx={{ fontWeight: 600, mb: 1 }}`
- **Text:** "Dashboard"

#### Page-Subtitle
- **Element:** `<Typography>`
- **Props:**
  - `variant="body1"`
  - `color="text.secondary"`
- **Text:** "Übersicht über alle wichtigen Kennzahlen und Aktivitäten"

#### KPI-Cards-Grid
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}`

#### KPI-Cards (8 Stück)

##### 1. Gesamtpersonal
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Gesamtpersonal"`
  - `value={kpis.totalStaff}`
  - `subtitle="Aktive Mitarbeiter"`
  - `icon={<People />}`
  - `color="#2196f3"`
  - `trend={kpis.staffGrowth}`

##### 2. Offene Schichten
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Offene Schichten"`
  - `value={kpis.openShifts}`
  - `subtitle="Noch zu besetzen"`
  - `icon={<Schedule />}`
  - `color="#ff9800"`
  - `trend={kpis.shiftTrend}`

##### 3. Auslastung
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Auslastung"`
  - `value={`${kpis.utilization}%`}`
  - `subtitle="Schichten besetzt"`
  - `icon={<TrendingUp />}`
  - `color="#4caf50"`
  - `trend={kpis.utilizationTrend}`

##### 4. Einrichtungen
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Einrichtungen"`
  - `value={kpis.facilities}`
  - `subtitle="Verwaltete Standorte"`
  - `icon={<Business />}`
  - `color="#9c27b0"`
  - `trend={kpis.facilityTrend}`

##### 5. Wöchentliche Stunden
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Wöchentliche Stunden"`
  - `value={kpis.totalHours}`
  - `subtitle="Gesamtstunden"`
  - `icon={<AccessTime />}`
  - `color="#00bcd4"`

##### 6. Ausstehende Einsätze
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Ausstehende Einsätze"`
  - `value={kpis.pendingAssignments}`
  - `subtitle="Zu bestätigen"`
  - `icon={<Assignment />}`
  - `color="#ff5722"`

##### 7. Ablaufende Dokumente
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Ablaufende Dokumente"`
  - `value={kpis.expiringDocuments}`
  - `subtitle="Zu erneuern"`
  - `icon={<Warning />}`
  - `color="#f44336"`

##### 8. Aktive Mitarbeiter
- **Komponente:** `<AdminKPICard>`
- **Props:**
  - `title="Aktive Mitarbeiter"`
  - `value={kpis.activeStaff}`
  - `subtitle="Im System"`
  - `icon={<Person />}`
  - `color="#4caf50"`

#### Quick-Actions-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Section-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h5"`
  - `sx={{ fontWeight: 600, mb: 2 }}`
- **Text:** "Schnellaktionen"

#### Actions-Grid
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}`

#### Action-Cards (4 Stück)

##### 1. Schicht erstellen
- **Element:** `<GlassCard>`
- **Props:**
  - `sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}`
  - `onClick={createShift}`
- **Content:**
  ```typescript
  <Add sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
    Schicht erstellen
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Neue Schicht anlegen
  </Typography>
  ```

##### 2. Mitarbeiter hinzufügen
- **Element:** `<GlassCard>`
- **Props:**
  - `sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}`
  - `onClick={addStaff}`
- **Content:**
  ```typescript
  <PersonAdd sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
    Mitarbeiter hinzufügen
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Neuen Mitarbeiter anlegen
  </Typography>
  ```

##### 3. Bericht exportieren
- **Element:** `<GlassCard>`
- **Props:**
  - `sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}`
  - `onClick={exportReport}`
- **Content:**
  ```typescript
  <FileDownload sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
    Bericht exportieren
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Daten exportieren
  </Typography>
  ```

##### 4. Einstellungen
- **Element:** `<GlassCard>`
- **Props:**
  - `sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}`
  - `onClick={openSettings}`
- **Content:**
  ```typescript
  <Settings sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
    Einstellungen
  </Typography>
  <Typography variant="body2" color="text.secondary">
    System konfigurieren
  </Typography>
  ```

#### Alerts-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Section-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h5"`
  - `sx={{ fontWeight: 600, mb: 2 }}`
- **Text:** "Wichtige Hinweise"

#### Alerts-Panel
- **Komponente:** `<AlertsPanel>`
- **Props:**
  - `alerts={alerts}`

#### Statistics-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Section-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h5"`
  - `sx={{ fontWeight: 600, mb: 2 }}`
- **Text:** "Statistiken"

#### Statistics-Tabs
- **Komponente:** `<StatisticsTabs>`
- **Props:**
  - `weeklyHours={weeklyHours}`
  - `monthlyHours={monthlyHours}`
  - `shiftCompletion={shiftCompletion}`
  - `staffActivity={staffActivity}`

#### Recent-Activities-Section
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mb: 4 }}`

#### Section-Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="h5"`
  - `sx={{ fontWeight: 600, mb: 2 }}`
- **Text:** "Letzte Aktivitäten"

#### Recent-Activities
- **Komponente:** `<RecentActivities>`
- **Props:**
  - `activities={recentActivities}`

### Funktions-Analyse

#### State-Management
```typescript
const {
  allUsers,
  weeklyTimesheets,
  allAssignments,
  allShifts,
  allFacilities,
  allDocuments,
  allActivities,
  kpis,
  alerts,
  staff,
  weeklyHours,
  monthlyHours,
  shiftCompletion,
  staffActivity,
  recentActivities,
  getRecentActivities,
  createShift,
  addStaff,
  exportReport,
  openSettings,
  getUserStatsByRole,
  getAssignmentStatsByStatus,
  getShiftStatsByType,
  getTopPerformers,
  getTopFacilities,
  isLoading,
  error,
} = useAdminDashboard();
```

#### Action-Handler
```typescript
const createShift = async () => {
  router.push('/admin/shifts?create=true');
};

const addStaff = async () => {
  router.push('/admin/mitarbeiter');
};

const exportReport = async () => {
  router.push('/admin/berichte');
};

const openSettings = () => {
  router.push('/admin/einstellungen');
};
```

#### Loading-States
```typescript
if (isLoading) {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1280px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    </Box>
  );
}
```

#### Imports
```typescript
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { AlertsPanel } from '@/components/admin/AlertsPanel';
import { StatisticsTabs } from '@/components/admin/StatisticsTabs';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { Add, PersonAdd, FileDownload, Settings, People, Schedule, TrendingUp, Business, AccessTime, Assignment, Warning, Person } from '@mui/icons-material';
```

---

## 2. AdminKPICard-Komponente

### Datei: `components/admin/AdminKPICard.tsx`
**Status:** ✅ Vollständig implementiert

### Interface-Definition
```typescript
interface AdminKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
}
```

### UI-Analyse

#### Root-Container
- **Element:** `<GlassCard>`
- **Props:** Standard Glassmorphismus-Styling

#### Card-Content
- **Element:** `<Box>`
- **Props:**
  - `sx={{ p: 3 }}`

#### Header-Layout
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}`

#### Text-Content
- **Element:** `<Box>`
- **Props:** Standard Box

#### Title
- **Element:** `<Typography>`
- **Props:**
  - `variant="body2"`
  - `color="text.secondary"`
  - `sx={{ mb: 1 }}`
- **Content:** `{title}`

#### Value
- **Element:** `<Typography>`
- **Props:**
  - `variant="h4"`
  - `sx={{ color, fontWeight: 700 }}`
- **Content:** `{value}`

#### Subtitle (Conditional)
- **Element:** `<Typography>`
- **Props:**
  - `variant="body2"`
  - `color="text.secondary"`
  - `sx={{ mt: 0.5 }}`
- **Content:** `{subtitle}`
- **Conditional Rendering:** `{subtitle && <Typography>...}`

#### Icon-Container
- **Element:** `<Box>`
- **Props:**
  - `sx={{ width: 48, height: 48, backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}`
- **Content:** `{icon}`

#### Trend-Section (Conditional)
- **Element:** `<Box>`
- **Props:**
  - `sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}`
- **Conditional Rendering:** `{trend && <Box>...}`

#### Trend-Value
- **Element:** `<Typography>`
- **Props:**
  - `variant="body2"`
  - `sx={{ color: trend.isPositive ? 'success.main' : 'error.main', fontWeight: 500 }}`
- **Content:** `{trend.isPositive ? '+' : ''}{trend.value}%`

#### Trend-Label
- **Element:** `<Typography>`
- **Props:**
  - `variant="body2"`
  - `color="text.secondary"`
- **Content:** "vs. letzte Woche"

#### Progress-Section (Conditional)
- **Element:** `<Box>`
- **Props:**
  - `sx={{ mt: 2 }}`
- **Conditional Rendering:** `{progress !== undefined && <Box>...}`

#### Progress-Bar
- **Element:** `<LinearProgress>`
- **Props:**
  - `variant="determinate"`
  - `value={progress}`
  - `sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: color } }}`

#### Progress-Label
- **Element:** `<Typography>`
- **Props:**
  - `variant="body2"`
  - `color="text.secondary"`
  - `sx={{ mt: 1 }}`
- **Content:** `{progress}% des Ziels erreicht`

### Funktions-Analyse

#### Props-Handling
- **Title:** String für KPI-Titel
- **Value:** String oder Number für KPI-Wert
- **Subtitle:** Optionaler String für zusätzliche Information
- **Icon:** ReactNode für Icon-Darstellung
- **Color:** String für Theme-Farbe
- **Trend:** Optionales Objekt mit Wert und Richtung
- **Progress:** Optionaler Number für Fortschrittsanzeige

#### Styling-Features
- **Glassmorphismus:** GlassCard als Container
- **Responsive Design:** Flexbox-Layout
- **Color-Theming:** Dynamische Farben basierend auf Props
- **Icon-Integration:** Zentrierte Icons in farbigen Kreisen
- **Progress-Visualization:** LinearProgress mit Custom-Styling

---

## 3. useAdminDashboard-Hook

### Datei: `lib/hooks/useAdminDashboard.ts`
**Status:** ✅ Vollständig implementiert

### Interface-Definitionen
```typescript
interface TimesheetData {
  totalHours?: number;
  date?: string | Date;
}

interface ActivityWithStatus extends Activity {
  status?: string;
}
```

### State-Management

#### Auth-Integration
```typescript
const { user: _user } = useAuth();
const router = useRouter();
const { alerts } = useAdminAlerts();
```

#### Data-Queries (7 Stück)

##### 1. Users Query
```typescript
const { data: usersData, isLoading: loadingUsers } = useQuery<PaginatedResponse<User>>({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    try {
      return await userService.getAll(1, 100);
    } catch (error) {
      console.error('Error loading users:', error);
      return { data: [], total: 0, page: 1, limit: 100, hasMore: false };
    }
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

##### 2. Timesheets Query
```typescript
const { data: timesheetsData, isLoading: loadingTimesheets } = useQuery<Timesheet[]>({
  queryKey: ['admin', 'timesheets'],
  queryFn: async () => {
    try {
      return await timesheetService.getAll();
    } catch (error) {
      console.error('Error loading timesheets:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
});
```

##### 3. Assignments Query
```typescript
const { data: assignmentsData, isLoading: loadingAssignments } = useQuery<PaginatedResponse<Assignment>>({
  queryKey: ['admin', 'assignments'],
  queryFn: async () => {
    try {
      return await assignmentService.getAll();
    } catch (error) {
      console.error('Error loading assignments:', error);
      return { data: [], total: 0, page: 1, limit: 50, hasMore: false };
    }
  },
  staleTime: 5 * 60 * 1000,
});
```

##### 4. Shifts Query
```typescript
const { data: shiftsData, isLoading: loadingShifts } = useQuery<Shift[]>({
  queryKey: ['admin', 'shifts'],
  queryFn: async () => {
    try {
      const shifts = await shiftService.getAll();
      return shifts;
    } catch (error) {
      console.error('Error loading shifts:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
});
```

##### 5. Facilities Query
```typescript
const { data: facilitiesData, isLoading: loadingFacilities } = useQuery<Facility[]>({
  queryKey: ['admin', 'facilities'],
  queryFn: async () => {
    try {
      return await facilityService.getAll();
    } catch (error) {
      console.error('Error loading facilities:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
});
```

##### 6. Documents Query
```typescript
const { data: documentsData, isLoading: loadingDocuments } = useQuery<Doc[]>({
  queryKey: ['admin', 'documents'],
  queryFn: async () => {
    try {
      return await documentService.getAll();
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
});
```

##### 7. Activities Query
```typescript
const { data: activitiesData, isLoading: loadingActivities } = useQuery<Activity[]>({
  queryKey: ['admin', 'activities'],
  queryFn: async () => {
    try {
      return await activityService.getRecent(50);
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  },
  staleTime: 2 * 60 * 1000, // 2 minutes - activities change frequently
});
```

### Data-Processing

#### Raw Data Extraction
```typescript
const allUsers = usersData?.data || [];
const weeklyTimesheets = timesheetsData || [];
const allAssignments = assignmentsData?.data || [];
const allShifts = shiftsData || [];
const allFacilities = facilitiesData || [];
const allDocuments = documentsData || [];
```

#### KPI-Berechnung
```typescript
const kpis = {
  totalStaff: allUsers.length,
  activeStaff: allUsers.filter(u => u.active).length,
  openShifts: allShifts.filter(s => s.status === 'open').length,
  utilization: allShifts.length > 0 
    ? Math.round((allShifts.filter(s => s.status === 'filled').length / allShifts.length) * 100)
    : 0,
  facilities: allFacilities.length,
  totalHours: weeklyTimesheets.reduce((sum: number, ts: TimesheetData) => sum + (ts.totalHours || 0), 0),
  pendingAssignments: allAssignments.filter(a => a.status === 'pending').length,
  expiringDocuments: allDocuments.filter(d => d.status === 'expiring').length,
  staffGrowth: { value: 0, isPositive: true }, // TODO: Calculate from historical data
  shiftTrend: { value: 0, isPositive: false }, // TODO: Calculate from historical data
  utilizationTrend: { value: 0, isPositive: true }, // TODO: Calculate from historical data
  facilityTrend: { value: 0, isPositive: true }, // TODO: Calculate from historical data
};
```

### Statistics-Functions

#### getUserStatsByRole
```typescript
const getUserStatsByRole = () => {
  const stats: Record<string, number> = {};
  allUsers.forEach(user => {
    stats[user.role] = (stats[user.role] || 0) + 1;
  });
  return stats;
};
```

#### getAssignmentStatsByStatus
```typescript
const getAssignmentStatsByStatus = () => {
  const stats: Record<string, number> = {};
  allAssignments.forEach(assignment => {
    stats[assignment.status] = (stats[assignment.status] || 0) + 1;
  });
  return stats;
};
```

#### getShiftStatsByType
```typescript
const getShiftStatsByType = () => {
  const stats: Record<string, number> = {};
  allShifts.forEach(shift => {
    const type = shift.type || 'unknown';
    stats[type] = (stats[type] || 0) + 1;
  });
  return stats;
};
```

#### getTopPerformers
```typescript
const getTopPerformers = () => {
  // TODO: Calculate based on completed assignments and hours
  return [];
};
```

#### getTopFacilities
```typescript
const getTopFacilities = () => {
  // TODO: Calculate based on shift completion rate
  return [];
};
```

#### getRecentActivities
```typescript
const getRecentActivities = () => {
  return (activitiesData || []).map(activity => ({
    type: activity.type,
    message: activity.description || activity.type,
    timestamp: activity.timestamp,
    status: (activity as ActivityWithStatus).status || 'pending'
  }));
};
```

### Chart-Data-Functions

#### getWeeklyHours
```typescript
const getWeeklyHours = () => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return days.map((name, index) => {
    const dayTimesheets = weeklyTimesheets.filter((ts: TimesheetData) => {
      const date = new Date(ts.date || '');
      return date.getDay() === ((index + 1) % 7); // Adjust for Monday start
    });
    const hours = dayTimesheets.reduce((sum: number, ts: TimesheetData) => sum + (ts.totalHours || 0), 0);
    return {
      name,
      hours: Math.round(hours * 10) / 10,
      target: index < 5 ? 8 : 6, // Weekdays 8h, weekends 6h
    };
  });
};
```

#### getStaffActivity
```typescript
const getStaffActivity = () => {
  const activeUsers = allUsers.filter(u => u.active);
  const onDuty = activeUsers.filter(u => u.currentStatus === 'active').length;
  const available = activeUsers.filter(u => u.currentStatus === 'inactive').length;
  const onBreak = activeUsers.filter(u => u.currentStatus === 'on-leave').length;
  const sick = activeUsers.filter(u => u.currentStatus === 'sick').length;

  return [
    { name: 'Im Dienst', value: onDuty, color: '#4caf50' },
    { name: 'Verfügbar', value: available, color: '#2196f3' },
    { name: 'Pause', value: onBreak, color: '#ff9800' },
    { name: 'Krank', value: sick, color: '#f44336' },
  ];
};
```

#### getShiftCompletion
```typescript
const getShiftCompletion = () => {
  const filled = allShifts.filter(s => s.status === 'filled').length;
  const open = allShifts.filter(s => s.status === 'open').length;
  const total = filled + open;

  return [
    { 
      name: 'Besetzt', 
      value: total > 0 ? Math.round((filled / total) * 100) : 0, 
      color: '#4caf50' 
    },
    { 
      name: 'Offen', 
      value: total > 0 ? Math.round((open / total) * 100) : 0, 
      color: '#f44336' 
    },
  ];
};
```

### Action-Functions

#### createShift
```typescript
const createShift = async () => {
  router.push('/admin/shifts?create=true');
};
```

#### addStaff
```typescript
const addStaff = async () => {
  router.push('/admin/mitarbeiter');
};
```

#### exportReport
```typescript
const exportReport = async () => {
  router.push('/admin/berichte');
};
```

#### openSettings
```typescript
const openSettings = () => {
  router.push('/admin/einstellungen');
};
```

### Loading-State
```typescript
const isLoading = 
