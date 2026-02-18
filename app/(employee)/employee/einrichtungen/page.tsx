'use client';

import { useState } from 'react';
import { logger } from '@/lib/logging';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PageContainer } from '@/components/layout/PageContainer';
import { useEmployeeFacilities } from '@/lib/hooks/useEmployeeFacilities';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Directions,
  People,
  Favorite,
  FavoriteBorder,
  Print,
  Download,
  Refresh,
  Search,
  Info,
  Work,
  ContactPhone,
  DirectionsCar,
  DirectionsBus,
  DirectionsWalk,
  DirectionsBike,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facilities-tabpanel-${index}`}
      aria-labelledby={`facilities-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeFacilitiesPage() {
  const { user, loading: authLoading } = useAuth();

  const {
    facilities,
    isLoading,
    error,
    getFacilityStats,
    getDirections,
    addToFavorites,
    removeFromFavorites,
    isAddingToFavorites,
    isRemovingFromFavorites,
  } = useEmployeeFacilities();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFacilityClick = (facilityId: string) => {
    setSelectedFacility(facilityId);
    setDetailsDialogOpen(true);
  };

  const handleGetDirections = async (facilityId: string) => {
    try {
      await getDirections(facilityId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleAddToFavorites = async (facilityId: string) => {
    try {
      await addToFavorites(facilityId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleRemoveFromFavorites = async (facilityId: string) => {
    try {
      await removeFromFavorites(facilityId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const getFacilityTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Business color="primary" />;
      case 'clinic':
        return <Business color="secondary" />;
      case 'nursing_home':
        return <Business color="info" />;
      default:
        return <Business color="inherit" />;
    }
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'primary';
      case 'clinic':
        return 'secondary';
      case 'nursing_home':
        return 'info';
      default:
        return 'default';
    }
  };

  const stats = getFacilityStats();
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch =
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || facility.type === filterType;
    return matchesSearch && matchesType;
  });

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Einrichtungen werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melde dich an, um Einrichtungen zu verwalten.</Alert>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Meine Einrichtungen
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Übersicht über Ihre zugewiesenen Einrichtungen und Kontaktinformationen
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {stats.totalFacilities}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Einrichtungen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.activeFacilities}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aktiv
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.favoriteFacilities}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Favoriten
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.totalShifts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schichten
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={() => {
            try {
              const header = [
                'Name',
                'Adresse',
                'Typ',
                'Telefon',
                'E-Mail',
                'Bewertung',
                'Schichten',
              ];
              const rows = filteredFacilities.map(f => [
                (f.name || '').replaceAll(';', ','),
                (f.address || '').replaceAll(';', ','),
                f.type || '',
                f.phone || '',
                f.email || '',
                String(f.rating ?? ''),
                String(f.shiftCount ?? ''),
              ]);
              const csv = [header.join(';'), ...rows.map(r => r.join(';'))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'einrichtungen.csv';
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              logger.error('Export fehlgeschlagen', e instanceof Error ? e : new Error(String(e)));
            }
          }}
        >
          Export PDF
        </Button>
        <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>
          Drucken
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => window.location.reload()}>
          Aktualisieren
        </Button>
      </Box>

      {/* Filters */}
      <Paper className="glass" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Einrichtungen verwalten
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Einrichtungen suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Typ</InputLabel>
              <Select value={filterType} label="Typ" onChange={e => setFilterType(e.target.value)}>
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="hospital">Krankenhaus</MenuItem>
                <MenuItem value="clinic">Klinik</MenuItem>
                <MenuItem value="nursing_home">Pflegeheim</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper className="glass" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Alle Einrichtungen" icon={<Business />} iconPosition="start" />
          <Tab label="Favoriten" icon={<Favorite />} iconPosition="start" />
          <Tab label="Kontakte" icon={<ContactPhone />} iconPosition="start" />
          <Tab label="Anfahrt" icon={<Directions />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {filteredFacilities.map(facility => (
            <Grid key={facility.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card className="glass">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getFacilityTypeIcon(facility.type)}
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
                      {facility.name}
                    </Typography>
                    <Chip
                      label={facility.type}
                      color={getFacilityTypeColor(facility.type) as ChipProps['color']}
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {facility.address}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {facility.shiftCount} Schichten • {facility.rating}★
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleAddToFavorites(facility.id)}
                        disabled={isAddingToFavorites}
                      >
                        {facility.isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                      </IconButton>
                      <IconButton size="small" onClick={() => handleGetDirections(facility.id)}>
                        <Directions />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleFacilityClick(facility.id)}
                  >
                    Details anzeigen
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {filteredFacilities
            .filter(f => f.isFavorite)
            .map(facility => (
              <Grid key={facility.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card className="glass">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getFacilityTypeIcon(facility.type)}
                      <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
                        {facility.name}
                      </Typography>
                      <Chip label="Favorit" color="error" size="small" sx={{ ml: 'auto' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {facility.address}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {facility.shiftCount} Schichten • {facility.rating}★
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFromFavorites(facility.id)}
                          disabled={isRemovingFromFavorites}
                        >
                          <Favorite color="error" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleGetDirections(facility.id)}>
                          <Directions />
                        </IconButton>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleFacilityClick(facility.id)}
                    >
                      Details anzeigen
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {filteredFacilities.map(facility => (
            <Grid key={facility.id} size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ mr: 1 }} />
                    {facility.name}
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Adresse"
                        secondary={facility.address}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                      <IconButton size="small">
                        <LocationOn />
                      </IconButton>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Telefon"
                        secondary={facility.phone}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                      <IconButton size="small">
                        <Phone />
                      </IconButton>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="E-Mail"
                        secondary={facility.email}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                      <IconButton size="small">
                        <Email />
                      </IconButton>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Ansprechpartner"
                        secondary={facility.contactPerson}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                      <IconButton size="small">
                        <People />
                      </IconButton>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          {filteredFacilities.map(facility => (
            <Grid key={facility.id} size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Directions sx={{ mr: 1 }} />
                    {facility.name}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {facility.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entfernung: {facility.distance} km • Fahrzeit: {facility.travelTime}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DirectionsCar />}
                      onClick={() => handleGetDirections(facility.id)}
                    >
                      Auto
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DirectionsBus />}
                      onClick={() => handleGetDirections(facility.id)}
                    >
                      ÖPNV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DirectionsWalk />}
                      onClick={() => handleGetDirections(facility.id)}
                    >
                      Zu Fuß
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DirectionsBike />}
                      onClick={() => handleGetDirections(facility.id)}
                    >
                      Fahrrad
                    </Button>
                  </Box>

                  {facility.specialInstructions && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Besondere Hinweise:</strong> {facility.specialInstructions}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Facility Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Einrichtungsdetails</DialogTitle>
        <DialogContent>
          {selectedFacility && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {facilities.find(f => f.id === selectedFacility)?.name}
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<Info />}>
                  <Typography variant="subtitle1">Allgemeine Informationen</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Adresse"
                        secondary={facilities.find(f => f.id === selectedFacility)?.address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Telefon"
                        secondary={facilities.find(f => f.id === selectedFacility)?.phone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="E-Mail"
                        secondary={facilities.find(f => f.id === selectedFacility)?.email}
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<People />}>
                  <Typography variant="subtitle1">Kontaktpersonen</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Ansprechpartner"
                        secondary={facilities.find(f => f.id === selectedFacility)?.contactPerson}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Schichtleitung"
                        secondary={facilities.find(f => f.id === selectedFacility)?.shiftSupervisor}
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<Work />}>
                  <Typography variant="subtitle1">Schichtinformationen</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Schichtanzahl"
                        secondary={facilities.find(f => f.id === selectedFacility)?.shiftCount}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Bewertung"
                        secondary={`${facilities.find(f => f.id === selectedFacility)?.rating} Sterne`}
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Schließen</Button>
          <Button variant="contained" onClick={() => handleGetDirections(selectedFacility!)}>
            Anfahrt
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
