'use client';
import { useAssignments } from '@/lib/hooks/useAssignments';
import { useRole } from '@/contexts/RoleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Assignment } from '@/lib/types/assignment';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Assignment as AssignmentIcon,
  Cancel,
  CheckCircle,
  Edit,
  Person,
  Schedule,
  FilterList,
  Refresh,
  Search,
  Clear,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Typography,
  TextField,
  InputLabel,
  IconButton,
  Alert,
  Paper,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { useState, useMemo } from 'react';

/** Erweiterung für Anzeige (API kann optionale Felder liefern) */
type AssignmentWithDisplay = Assignment & {
  title?: string;
  facility?: { name: string };
  priority?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  assignedTo?: { displayName: string };
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { currentRole, setCurrentRole } = useRole();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  // State für Filter
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Filter-Objekt für useAssignments
  const filters = useMemo(() => ({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    search: searchTerm || undefined,
  }), [statusFilter, priorityFilter, searchTerm]);

  const {
    assignments,
    pendingAssignments,
    acceptedAssignments,
    declinedAssignments,
    completedAssignments,
    isLoading,
    error,
    acceptAssignment,
    declineAssignment,
    updateAssignment,
    deleteAssignment,
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
    getPriorityLabel,
    formatDate,
    formatTime,
    formatDateTime,
    getStats,
    isAccepting,
    isDeclining,
    isDeleting,
    refetch,
  } = useAssignments(filters);

  const stats = getStats();

  const getTabContent = () => {
    switch (activeTab) {
      case 0:
        return assignments;
      case 1:
        return pendingAssignments;
      case 2:
        return acceptedAssignments;
      case 3:
        return declinedAssignments;
      case 4:
        return completedAssignments;
      default:
        return [];
    }
  };

  const handleAccept = (assignmentId: string) => {
    acceptAssignment(assignmentId);
  };

  const handleDecline = (assignmentId: string) => {
    declineAssignment(assignmentId);
  };

  const handleDelete = (assignmentId: string) => {
    deleteAssignment(assignmentId);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchTerm('');
  };

  if (isLoading) {
    return <LoadingSpinner message="Einsätze werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Bitte melde dich an, um Einsätze zu verwalten.
        </Alert>
      </Box>
    );
  }

  const currentAssignments = getTabContent();

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Einsatzverwaltung
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
            >
              Verwalte und überwache alle Einsätze und Schichtzuweisungen
            </Typography>
          </Box>
          <IconButton onClick={() => refetch()} sx={{ color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)' }}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Statistiken */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ausstehend
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {stats.accepted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Angenommen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                  {stats.declined}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Abgelehnt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Abgeschlossen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <Paper
          className="glass"
          sx={{
            p: 3,
            mb: 3,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Einsatz suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="pending">Ausstehend</MenuItem>
                  <MenuItem value="accepted">Angenommen</MenuItem>
                  <MenuItem value="declined">Abgelehnt</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Priorität</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priorität"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="urgent">Dringend</MenuItem>
                  <MenuItem value="high">Hoch</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="low">Niedrig</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                fullWidth
                size="small"
              >
                Filter zurücksetzen
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper
          className="glass"
          sx={{
            mb: 3,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={`Alle (${assignments.length})`} 
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Ausstehend (${stats.pending})`} 
              icon={<Badge badgeContent={stats.pending} color="warning"><AssignmentIcon /></Badge>}
              iconPosition="start"
            />
            <Tab 
              label={`Angenommen (${stats.accepted})`} 
              icon={<Badge badgeContent={stats.accepted} color="success"><AssignmentIcon /></Badge>}
              iconPosition="start"
            />
            <Tab 
              label={`Abgelehnt (${stats.declined})`} 
              icon={<Badge badgeContent={stats.declined} color="error"><AssignmentIcon /></Badge>}
              iconPosition="start"
            />
            <Tab 
              label={`Abgeschlossen (${stats.completed})`} 
              icon={<Badge badgeContent={stats.completed} color="info"><AssignmentIcon /></Badge>}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Assignments List */}
        {currentAssignments.length === 0 ? (
          <Paper
            className="glass"
            sx={{
              p: 4,
              textAlign: 'center',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Keine Einsätze gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Versuche andere Filter oder erstelle einen neuen Einsatz.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {(currentAssignments as AssignmentWithDisplay[]).map((assignment) => {
              const d = assignment as AssignmentWithDisplay;
              const startD = d.startDate ?? assignment.assignedAt;
              const endD = d.endDate ?? assignment.assignedAt;
              return (
              <Grid key={assignment.id} size={{ xs: 12, md: 6 }}>
                <Card
                  className="glass"
                  sx={{
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                            fontWeight: 600,
                          }}
                        >
                          {d.title ?? `Einsatz ${assignment.id.slice(0, 8)}`}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                        >
                          {d.facility?.name ?? 'Einrichtung nicht verfügbar'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(assignment.status)}
                          color={getStatusColor(assignment.status) as 'success' | 'error' | 'warning' | 'info'}
                          size="small"
                        />
                        {d.priority != null && (
                        <Chip
                          label={getPriorityLabel(d.priority)}
                          color={getPriorityColor(d.priority) as 'success' | 'error' | 'warning' | 'info'}
                          size="small"
                          variant="outlined"
                        />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule
                        sx={{
                          fontSize: 16,
                          color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)',
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                      >
                        {startD ? `${formatDate(startD)} • ${formatTime(startD)}${endD ? ` - ${formatTime(endD)}` : ''}` : '—'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person
                        sx={{
                          fontSize: 16,
                          color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)',
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                      >
                        {d.assignedTo?.displayName ?? 'Nicht zugewiesen'}
                      </Typography>
                    </Box>

                    {assignment.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAccept(assignment.id)}
                          disabled={isAccepting}
                          sx={{ flex: 1 }}
                        >
                          {isAccepting ? 'Annehme...' : 'Annehmen'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleDecline(assignment.id)}
                          disabled={isDeclining}
                          sx={{ flex: 1 }}
                        >
                          {isDeclining ? 'Lehne ab...' : 'Ablehnen'}
                        </Button>
                      </Box>
                    )}

                    {assignment.status === 'accepted' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" startIcon={<Edit />} sx={{ flex: 1 }}>
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleDelete(assignment.id)}
                          disabled={isDeleting}
                          sx={{ flex: 1 }}
                        >
                          {isDeleting ? 'Lösche...' : 'Stornieren'}
                        </Button>
                      </Box>
                    )}

                    {(assignment.status === 'declined' || assignment.status === 'completed') && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleDelete(assignment.id)}
                          disabled={isDeleting}
                          sx={{ flex: 1 }}
                        >
                          {isDeleting ? 'Lösche...' : 'Löschen'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );})}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
