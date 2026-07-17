'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { templateService } from '@/lib/services';
import type { CompanyTemplate, TemplateChannel, TemplateStatus } from '@/lib/types';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Grid,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { GlassCard } from '@/components/ui/GlassCard';
import { DebouncedSearch } from '@/components/ui/DebouncedSearch';
import { LoadingSpinner, InlineSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDestructiveDialog } from '@/components/ui/ConfirmDestructiveDialog';

type FilterChannel = TemplateChannel | 'all';
type FilterStatus = TemplateStatus | 'all';
type FilterLocale = string | 'all';

interface TemplateFormValues {
  key: string;
  channel: TemplateChannel;
  name: string;
  description: string;
  locale: string;
  title: string;
  message: string;
  subject: string;
  bodyHtml: string;
  actionText: string;
  status: TemplateStatus;
  tags: string;
  category: string;
}

interface TemplateEditorDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: CompanyTemplate | null;
  onClose: () => void;
  onSubmit: (values: TemplateFormValues) => Promise<void> | void;
  isSubmitting: boolean;
}

interface TemplatePreviewDialogProps {
  open: boolean;
  template: CompanyTemplate | null;
  onClose: () => void;
}

const channelLabels: Record<TemplateChannel, string> = {
  app: 'In-App',
  'in-app': 'In-App',
  email: 'E-Mail',
  push: 'Push',
  sms: 'SMS',
};

const statusLabels: Record<TemplateStatus, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  published: 'Veröffentlicht',
  archived: 'Archiviert',
};

function createDefaultFormValues(channel: TemplateChannel = 'app'): TemplateFormValues {
  return {
    key: '',
    channel,
    name: '',
    description: '',
    locale: 'de',
    title: '',
    message: '',
    subject: '',
    bodyHtml: '',
    actionText: '',
    status: 'draft',
    tags: '',
    category: '',
  };
}

function mapTemplateToFormValues(template: CompanyTemplate): TemplateFormValues {
  return {
    key: template.key,
    channel: template.channel,
    name: template.name,
    description: template.description || '',
    locale: template.locale || 'de',
    title: template.title || '',
    message: template.message || template.bodyHtml?.replace(/<[^>]+>/g, '').trim() || '',
    subject: template.subject || '',
    bodyHtml: template.bodyHtml || '',
    actionText: template.actionText || '',
    status: template.status,
    tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
    category: template.category || '',
  };
}

function TemplatePreviewDialog({ open, template, onClose }: TemplatePreviewDialogProps) {
  if (!template) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Template-Vorschau</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Keine Template-Daten vorhanden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Schließen</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const localeLabel = (template.locale || 'de').toUpperCase();
  const title = template.title || template.subject || 'Titel';
  const subject = template.subject || template.title || 'Betreff';
  const plainMessage = template.message || '';
  const htmlContent = template.bodyHtml || '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Template-Vorschau</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {template.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {template.key} · {channelLabels[template.channel]} · {localeLabel}
            </Typography>
            <Chip
              label={statusLabels[template.status]}
              size="small"
              color={template.status === 'published' ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider />

          {template.channel === 'app' ? (
            <GlassCard>
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  In-App Benachrichtigung
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {plainMessage || 'Nachrichtentext'}
                </Typography>
                {template.actionText && (
                  <Button variant="contained" sx={{ mt: 2 }} size="small">
                    {template.actionText}
                  </Button>
                )}
              </Box>
            </GlassCard>
          ) : (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Betreff
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {subject}
                </Typography>
              </Paper>
              {htmlContent && (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    HTML-Inhalt
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mt: 1,
                      p: 2,
                      backgroundColor: 'background.paper',
                      maxHeight: 360,
                      overflowY: 'auto',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(htmlContent, {
                        ALLOWED_TAGS: [
                          'p',
                          'br',
                          'strong',
                          'em',
                          'u',
                          'a',
                          'ul',
                          'ol',
                          'li',
                          'h1',
                          'h2',
                          'h3',
                          'h4',
                          'h5',
                          'h6',
                          'div',
                          'span',
                          'img',
                          'table',
                          'thead',
                          'tbody',
                          'tr',
                          'td',
                          'th',
                          'style',
                        ],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
                      }),
                    }}
                  />
                </Paper>
              )}
              {plainMessage && (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Textversion
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {plainMessage}
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}

function TemplateEditorDialog({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: TemplateEditorDialogProps) {
  const [form, setForm] = useState<TemplateFormValues>(() => createDefaultFormValues());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      setForm(mapTemplateToFormValues(initialData));
    } else {
      setForm(createDefaultFormValues(initialData?.channel ?? 'app'));
    }
    setErrors({});
  }, [open, mode, initialData]);

  const handleFieldChange = useCallback(
    (field: keyof TemplateFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setForm(prev => ({
          ...prev,
          [field]: value,
        }));
      },
    []
  );

  const handleSelectChange = useCallback(
    (field: keyof TemplateFormValues) => (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value;
      setForm(prev => ({
        ...prev,
        [field]: field === 'channel' ? (value as TemplateChannel) : (value as string),
      }));
    },
    []
  );

  const handleToggleStatus = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setForm(prev => ({
        ...prev,
        status: checked ? 'published' : 'draft',
      }));
    },
    []
  );

  const derivePlainText = useCallback((html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (mode === 'create' && !form.key.trim()) {
      nextErrors.key = 'Schlüssel ist erforderlich';
    }

    if (!form.name.trim()) {
      nextErrors.name = 'Name ist erforderlich';
    }

    if (!form.locale.trim()) {
      nextErrors.locale = 'Sprache ist erforderlich';
    }

    if (form.channel === 'app') {
      if (!form.title.trim()) {
        nextErrors.title = 'Titel ist erforderlich';
      }
      if (!form.message.trim()) {
        nextErrors.message = 'Nachrichtentext ist erforderlich';
      }
    }

    if (form.channel === 'email') {
      if (!form.subject.trim()) {
        nextErrors.subject = 'Betreff ist erforderlich';
      }
      if (!form.bodyHtml.trim()) {
        nextErrors.bodyHtml = 'HTML-Inhalt ist erforderlich';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const normalized: TemplateFormValues = {
      ...form,
      key: form.key.trim(),
      channel: form.channel,
      name: form.name.trim(),
      description: form.description.trim(),
      locale: form.locale.trim() || 'de',
      title: form.title.trim(),
      message: form.message.trim(),
      subject: form.subject.trim(),
      bodyHtml: form.bodyHtml.trim(),
      actionText: form.actionText.trim(),
      status: form.status,
      tags: form.tags,
      category: form.category.trim(),
    };

    if (normalized.channel === 'email' && !normalized.message) {
      normalized.message = derivePlainText(normalized.bodyHtml);
    }

    await onSubmit(normalized);
  };

  const previewMessage =
    form.message.trim() || (form.channel === 'email' ? derivePlainText(form.bodyHtml) : '');
  const previewHtml = form.bodyHtml;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Neues Template erstellen' : 'Template bearbeiten'}
      </DialogTitle>
      <DialogContent dividers sx={{ height: '80vh' }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ overflowY: 'auto', pr: { md: 2 }, pt: 1 }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Schlüssel"
                  fullWidth
                  value={form.key}
                  onChange={handleFieldChange('key')}
                  disabled={mode === 'edit'}
                  error={Boolean(errors.key)}
                  helperText={errors.key}
                />
                <FormControl fullWidth>
                  <InputLabel id="channel-label">Kanal</InputLabel>
                  <Select
                    labelId="channel-label"
                    label="Kanal"
                    value={form.channel}
                    onChange={handleSelectChange('channel')}
                    disabled={mode === 'edit'}
                  >
                    <MenuItem value="app">In-App</MenuItem>
                    <MenuItem value="email">E-Mail</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Sprache (Locale)"
                  fullWidth
                  value={form.locale}
                  onChange={handleFieldChange('locale')}
                  error={Boolean(errors.locale)}
                  helperText={errors.locale}
                />
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Name"
                  fullWidth
                  value={form.name}
                  onChange={handleFieldChange('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
                <TextField
                  label="Beschreibung"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.description}
                  onChange={handleFieldChange('description')}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch checked={form.status === 'published'} onChange={handleToggleStatus} />
                }
                label={form.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
              />

              <Divider />

              {form.channel === 'app' ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    In-App Inhalte
                  </Typography>
                  <TextField
                    label="Titel"
                    fullWidth
                    value={form.title}
                    onChange={handleFieldChange('title')}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                  />
                  <TextField
                    label="Nachrichtentext"
                    fullWidth
                    multiline
                    minRows={4}
                    value={form.message}
                    onChange={handleFieldChange('message')}
                    error={Boolean(errors.message)}
                    helperText={errors.message}
                  />
                  <TextField
                    label="Button-Text (optional)"
                    fullWidth
                    value={form.actionText}
                    onChange={handleFieldChange('actionText')}
                  />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    E-Mail Inhalte
                  </Typography>
                  <TextField
                    label="Betreff"
                    fullWidth
                    value={form.subject}
                    onChange={handleFieldChange('subject')}
                    error={Boolean(errors.subject)}
                    helperText={errors.subject}
                  />
                  <TextField
                    label="Textversion (optional)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.message}
                    onChange={handleFieldChange('message')}
                    helperText="Falls leer, wird aus dem HTML automatisch eine Textversion erzeugt."
                  />
                  <TextField
                    label="HTML-Inhalt"
                    fullWidth
                    multiline
                    minRows={6}
                    value={form.bodyHtml}
                    onChange={handleFieldChange('bodyHtml')}
                    error={Boolean(errors.bodyHtml)}
                    helperText={errors.bodyHtml}
                  />
                </Stack>
              )}

              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Metadaten
                </Typography>
                <TextField
                  label="Tags (Kommagetrennt)"
                  fullWidth
                  value={form.tags}
                  onChange={handleFieldChange('tags')}
                />
                <TextField
                  label="Kategorie (optional)"
                  fullWidth
                  value={form.category}
                  onChange={handleFieldChange('category')}
                />
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ overflowY: 'auto', pl: { md: 2 } }}>
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Vorschau
              </Typography>

              {form.channel === 'app' ? (
                <GlassCard>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {channelLabels[form.channel]} · {(form.locale || 'de').toUpperCase()}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                      {form.title || 'Titel'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                      {previewMessage || 'Nachrichtentext'}
                    </Typography>
                    {form.actionText && (
                      <Button variant="contained" sx={{ mt: 2 }} size="small">
                        {form.actionText}
                      </Button>
                    )}
                  </Box>
                </GlassCard>
              ) : (
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Betreff
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {form.subject || 'Betreff'}
                    </Typography>
                  </Paper>
                  {form.bodyHtml && (
                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        HTML-Inhalt
                      </Typography>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mt: 1,
                          p: 2,
                          backgroundColor: 'background.paper',
                          maxHeight: 360,
                          overflowY: 'auto',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(previewHtml, {
                            ALLOWED_TAGS: [
                              'p',
                              'br',
                              'strong',
                              'em',
                              'u',
                              'a',
                              'ul',
                              'ol',
                              'li',
                              'h1',
                              'h2',
                              'h3',
                              'h4',
                              'h5',
                              'h6',
                              'div',
                              'span',
                              'img',
                              'table',
                              'thead',
                              'tbody',
                              'tr',
                              'td',
                              'th',
                              'style',
                            ],
                            ALLOWED_ATTR: [
                              'href',
                              'src',
                              'alt',
                              'title',
                              'class',
                              'style',
                              'target',
                            ],
                          }),
                        }}
                      />
                    </Paper>
                  )}
                  {previewMessage && (
                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Textversion
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                        {previewMessage}
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? <InlineSpinner size={20} /> : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TemplateManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<FilterChannel>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [localeFilter, setLocaleFilter] = useState<FilterLocale>('all');
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CompanyTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyTemplate | null>(null);

  const queryKey = useMemo(
    () => ['companyTemplates', channelFilter, statusFilter, localeFilter, searchTerm],
    [channelFilter, statusFilter, localeFilter, searchTerm]
  );

  const {
    data: templates = [],
    isLoading,
    isError,
    error,
  } = useQuery<CompanyTemplate[]>({
    queryKey,
    queryFn: () =>
      templateService.list({
        channel: channelFilter === 'all' ? undefined : channelFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        locale: localeFilter === 'all' ? undefined : localeFilter,
        search: searchTerm || undefined,
      }),
    enabled: Boolean(user),
  });

  const availableLocales = useMemo(() => {
    const set = new Set<string>();
    templates.forEach(template => {
      if (template.locale) {
        set.add(template.locale);
      }
    });
    return Array.from(set).sort();
  }, [templates]);

  const openCreateDialog = () => {
    setEditorMode('create');
    setSelectedTemplate(null);
    setEditorOpen(true);
  };

  const openEditDialog = (template: CompanyTemplate) => {
    setEditorMode('edit');
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      const payload = {
        key: values.key.trim(),
        channel: values.channel,
        name: values.name.trim(),
        description: values.description.trim(),
        locale: values.locale.trim(),
        title: values.title,
        message: values.message,
        subject: values.subject,
        bodyHtml: values.bodyHtml,
        actionText: values.actionText,
        status: values.status,
        tags: values.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        category: values.category.trim(),
      };

      return templateService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditorOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues & { id: string }) => {
      const updatePayload = {
        name: values.name.trim(),
        description: values.description.trim(),
        locale: values.locale.trim(),
        title: values.title,
        message: values.message,
        subject: values.subject,
        bodyHtml: values.bodyHtml,
        actionText: values.actionText,
        status: values.status,
        tags: values.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        category: values.category.trim(),
      };
      return templateService.update(values.id, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditorOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => templateService.remove(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setDeleteTarget(null);
    },
  });

  const handleSubmit = async (formValues: TemplateFormValues) => {
    if (editorMode === 'create') {
      await createMutation.mutateAsync(formValues);
    } else if (selectedTemplate) {
      await updateMutation.mutateAsync({
        ...formValues,
        id: selectedTemplate.id,
      });
    }
  };

  const statusCounts = useMemo(
    () =>
      templates.reduce(
        (acc, template) => {
          acc.total += 1;
          if (template.status === 'published') acc.published += 1;
          if (template.channel === 'app') acc.app += 1;
          if (template.channel === 'email') acc.email += 1;
          return acc;
        },
        { total: 0, published: 0, app: 0, email: 0 }
      ),
    [templates]
  );

  if (!user) {
    return (
      <GlassCard>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">Bitte melde dich an, um Templates zu verwalten.</Alert>
        </Box>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <LoadingSpinner message="Templates werden geladen..." />
        </Box>
      </GlassCard>
    );
  }

  if (isError) {
    return (
      <GlassCard>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Fehler beim Laden der Templates:{' '}
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </Alert>
        </Box>
      </GlassCard>
    );
  }

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Template-Verwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Verwalte E-Mail- und In-App-Templates pro Mandant. Inhalte werden exakt wie hinterlegt
            ausgeliefert.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
            Neues Template
          </Button>
        </Stack>
      </Box>

      <GlassCard>
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <DebouncedSearch placeholder="Templates durchsuchen..." onSearch={setSearchTerm} />
              </Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexShrink: 0 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="channel-filter-label">Kanal</InputLabel>
                  <Select
                    labelId="channel-filter-label"
                    label="Kanal"
                    value={channelFilter}
                    onChange={event => setChannelFilter(event.target.value as FilterChannel)}
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    <MenuItem value="app">In-App</MenuItem>
                    <MenuItem value="email">E-Mail</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label="Status"
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value as FilterStatus)}
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    <MenuItem value="draft">Entwurf</MenuItem>
                    <MenuItem value="published">Veröffentlicht</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="locale-filter-label">Sprache</InputLabel>
                  <Select
                    labelId="locale-filter-label"
                    label="Sprache"
                    value={localeFilter}
                    onChange={event => setLocaleFilter(event.target.value as FilterLocale)}
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    {availableLocales.map(locale => (
                      <MenuItem key={locale} value={locale}>
                        {locale.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Gesamt: ${statusCounts.total}`} />
                <Chip label={`Veröffentlicht: ${statusCounts.published}`} color="success" />
                <Chip label={`In-App: ${statusCounts.app}`} />
                <Chip label={`E-Mail: ${statusCounts.email}`} />
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Template</TableCell>
                <TableCell>Kanal</TableCell>
                <TableCell>Sprache</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Letzte Änderung</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Keine Templates vorhanden
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Lege dein erstes Template an, um Benachrichtigungen anzupassen.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {templates.map(template => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.key}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={channelLabels[template.channel]}
                      size="small"
                      color={template.channel === 'app' ? 'primary' : 'info'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={template.locale.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[template.status]}
                      size="small"
                      color={template.status === 'published' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDistanceToNow(new Date(template.updatedAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Vorschau">
                        <IconButton onClick={() => setPreviewTemplate(template)} size="small" aria-label="Vorschau">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Bearbeiten">
                        <IconButton onClick={() => openEditDialog(template)} size="small" aria-label="Bearbeiten">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          onClick={() => setDeleteTarget(template)}
                          size="small"
                          color="error"
                          aria-label="Löschen"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      <TemplateEditorDialog
        open={isEditorOpen}
        mode={editorMode}
        initialData={selectedTemplate || undefined}
        onClose={() => {
          if (!createMutation.isPending && !updateMutation.isPending) {
            setEditorOpen(false);
          }
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <TemplatePreviewDialog
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      <ConfirmDestructiveDialog
        open={Boolean(deleteTarget)}
        title="Template löschen"
        description={`Dieses Template (${deleteTarget?.name}) wird dauerhaft gelöscht.`}
        confirmWord="LÖSCHEN"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        confirmLabel={deleteMutation.isPending ? 'Lösche...' : 'Löschen'}
      />
    </Box>
  );
}
