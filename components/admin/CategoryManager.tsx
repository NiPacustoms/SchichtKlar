'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, Close, Delete, Edit, Save, Cancel } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { categoriesService } from '@/lib/services/categories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleLabelMap, roleOptions } from '@/lib/validations/staff';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (categories: {
    roles: string[];
    groups: string[];
    qualifications: string[];
    jobTitles: string[];
  }) => void;
}

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
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function CategoryManager({ open, onClose, onSave }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState({
    roles: ['nurse', 'admin'],
    groups: ['Intensivstation', 'Operationssaal', 'Geriatrie', 'Pädiatrie'],
    qualifications: ['Krankenpfleger', 'Intensivpflege', 'OP-Pflege', 'Geriatrie'],
    jobTitles: [
      'Pflegefachkraft',
      'Stationsleitung',
      'Praxisanleiter',
      'Disponent',
      'Pflegeassistenz',
    ],
  });
  const queryClient = useQueryClient();
  const { data: fetchedCategories } = useQuery({
    queryKey: ['config', 'categories'],
    queryFn: () => categoriesService.get(),
    enabled: open,
  });

  useEffect(() => {
    if (fetchedCategories) {
      setCategories({
        roles: fetchedCategories.roles,
        groups: fetchedCategories.groups,
        qualifications: fetchedCategories.qualifications,
        jobTitles: fetchedCategories.jobTitles,
      });
    }
  }, [fetchedCategories]);

  const saveMutation = useMutation({
    mutationFn: () => categoriesService.set(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'categories'] });
    },
  });

  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<{ category: string; index: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const getCurrentCategory = () => {
    switch (activeTab) {
      case 0:
        return 'jobTitles';
      case 1:
        return 'roles';
      case 2:
        return 'groups';
      case 3:
        return 'qualifications';
      default:
        return 'roles';
    }
  };

  const handleAddItem = () => {
    const category = getCurrentCategory();
    if (
      newItem.trim() &&
      !categories[category as keyof typeof categories].includes(newItem.trim())
    ) {
      setCategories(prev => ({
        ...prev,
        [category]: [...prev[category as keyof typeof categories], newItem.trim()],
      }));
      setNewItem('');
    }
  };

  const handleDeleteItem = (category: string, index: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof categories].filter((_, i) => i !== index),
    }));
  };

  const handleStartEdit = (category: string, index: number) => {
    const items = categories[category as keyof typeof categories];
    setEditingItem({ category, index });
    setEditValue(items[index]);
  };

  const handleSaveEdit = () => {
    if (editingItem && editValue.trim()) {
      const { category, index } = editingItem;
      const items = categories[category as keyof typeof categories];

      // Check if the new value already exists (except for the current item)
      const exists = items.some((item, i) => i !== index && item === editValue.trim());

      if (!exists) {
        setCategories(prev => ({
          ...prev,
          [category]: prev[category as keyof typeof categories].map((item, i) =>
            i === index ? editValue.trim() : item
          ),
        }));
      }
    }
    setEditingItem(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync();
    onSave(categories);
    onClose();
  };

  const handleClose = () => {
    setActiveTab(0);
    setNewItem('');
    setEditingItem(null);
    setEditValue('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingItem) {
        handleSaveEdit();
      } else {
        handleAddItem();
      }
    } else if (e.key === 'Escape') {
      if (editingItem) {
        handleCancelEdit();
      }
    }
  };

  const currentCategory = getCurrentCategory();
  const currentItems = categories[currentCategory as keyof typeof categories];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Kategorien verwalten
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Berufsbezeichnungen" />
            <Tab label="Systemrollen" />
            <Tab label="Gruppen/Abteilungen" />
            <Tab label="Qualifikationen" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Neue Berufsbezeichnung hinzufügen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Berufsbezeichnung"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="z.B. Pflegefachkraft, Stationsleitung, Praxisanleiter..."
                helperText="Geben Sie eine neue Berufsbezeichnung ein"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!newItem.trim() || currentItems.includes(newItem.trim())}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Bestehende Berufsbezeichnungen ({currentItems.length})
            </Typography>

            {currentItems.length === 0 ? (
              <Alert severity="info">
                Keine Berufsbezeichnungen vorhanden. Fügen Sie eine neue hinzu.
              </Alert>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {currentItems.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {editingItem?.category === 'jobTitles' && editingItem?.index === index ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <TextField
                          fullWidth
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          autoFocus
                        />
                        <IconButton onClick={handleSaveEdit} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit}>
                          <Cancel />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={item} secondary={`Berufsbezeichnung ${index + 1}`} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleStartEdit('jobTitles', index)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteItem('jobTitles', index)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Systemrollen steuern die Berechtigungen in JobFlow (Admin, Disponent, Pflegekraft).
            Bitte ändern Sie diese nur, wenn Sie die Auswirkungen kennen.
          </Alert>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Systemrolle hinzufügen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Systemrolle"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="z.B. nurse, admin"
                helperText="Nur fortgeschrittene Nutzung – verweist auf technische Rollen"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!newItem.trim() || currentItems.includes(newItem.trim())}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Bestehende Systemrollen ({currentItems.length})
            </Typography>

            {currentItems.length === 0 ? (
              <Alert severity="info">Keine Rollen vorhanden. Fügen Sie eine neue hinzu.</Alert>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {currentItems.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {editingItem?.category === 'roles' && editingItem?.index === index ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <TextField
                          fullWidth
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          autoFocus
                        />
                        <IconButton onClick={handleSaveEdit} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit}>
                          <Cancel />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText
                          primary={
                            roleOptions.includes(item as (typeof roleOptions)[number])
                              ? roleLabelMap[item as (typeof roleOptions)[number]] || item
                              : item
                          }
                          secondary={`Systemrolle ${index + 1}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleStartEdit('roles', index)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteItem('roles', index)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Neue Gruppe/Abteilung hinzufügen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Gruppe/Abteilung"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="z.B. Intensivstation, Operationssaal, Geriatrie..."
                helperText="Geben Sie eine neue Gruppe oder Abteilung ein"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!newItem.trim() || currentItems.includes(newItem.trim())}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Bestehende Gruppen/Abteilungen ({currentItems.length})
            </Typography>

            {currentItems.length === 0 ? (
              <Alert severity="info">Keine Gruppen vorhanden. Fügen Sie eine neue hinzu.</Alert>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {currentItems.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {editingItem?.category === 'groups' && editingItem?.index === index ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <TextField
                          fullWidth
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          autoFocus
                        />
                        <IconButton onClick={handleSaveEdit} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit}>
                          <Cancel />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={item} secondary={`Gruppe ${index + 1}`} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleStartEdit('groups', index)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteItem('groups', index)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Neue Qualifikation hinzufügen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Qualifikation"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="z.B. Intensivpflege, OP-Pflege, Geriatrie..."
                helperText="Geben Sie eine neue Qualifikation ein"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!newItem.trim() || currentItems.includes(newItem.trim())}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Bestehende Qualifikationen ({currentItems.length})
            </Typography>

            {currentItems.length === 0 ? (
              <Alert severity="info">
                Keine Qualifikationen vorhanden. Fügen Sie eine neue hinzu.
              </Alert>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {currentItems.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {editingItem?.category === 'qualifications' && editingItem?.index === index ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <TextField
                          fullWidth
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          autoFocus
                        />
                        <IconButton onClick={handleSaveEdit} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit}>
                          <Cancel />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <ListItemText primary={item} secondary={`Qualifikation ${index + 1}`} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleStartEdit('qualifications', index)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteItem('qualifications', index)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <Divider />

        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Hinweis:</strong> Alle Kategorien werden in der gesamten Anwendung verwendet.
              Änderungen wirken sich auf alle bestehenden Mitarbeiter und Schichten aus. Achten Sie
              darauf, dass gelöschte Kategorien nicht mehr bei Mitarbeitern verwendet werden.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button onClick={handleSave} variant="contained">
          Änderungen speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
