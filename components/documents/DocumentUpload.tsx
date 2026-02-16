'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { documentTypeService } from '@/lib/services';
import { DocumentUploadForm } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { Close, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const documentSchema = z.object({
  type: z.string().min(1, 'Dokumenttyp ist erforderlich'),
  name: z.string().min(1, 'Name ist erforderlich'),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentUploadForm) => void;
  isLoading?: boolean;
  uploadProgress?: number;
}

export function DocumentUpload({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  uploadProgress = 0,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query für Dokumententypen
  const { data: documentTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => documentTypeService.getActiveTypes(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: '',
      name: '',
      expiryDate: '',
      notes: '',
    },
  });

  const watchedType = watch('type') || '';
  const watchedName = watch('name');

  useEffect(() => {
    if (open && documentTypes.length > 0 && !watchedType) {
      setValue('type', documentTypes[0].name);
    }
  }, [documentTypes, open, setValue, watchedType]);

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error('Datei ist zu groß. Maximum: 10MB');
      return;
    }

    setSelectedFile(file);

    // Auto-fill name if empty
    if (!watchedName) {
      setValue('name', file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFormSubmit = (data: DocumentFormData) => {
    if (!selectedFile) {
      toast.error('Bitte wähle eine Datei aus');
      return;
    }

    onSubmit({
      type: data.type as DocumentUploadForm['type'],
      name: data.name,
      file: selectedFile,
      expiresAt: data.expiryDate ? new Date(data.expiryDate) : new Date(),
    });
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dokument hochladen
          </Typography>
          <Button variant="outlined" size="small" onClick={handleClose} startIcon={<Close />}>
            Schließen
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            {/* File Upload Area */}
            <Grid size={{ xs: 12 }}>
              <GlassCard>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Datei auswählen
                  </Typography>

                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: dragActive ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: dragActive ? 'action.hover' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {selectedFile ? selectedFile.name : 'Datei hier ablegen oder klicken'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      PDF, JPG, PNG, DOC, DOCX (max. 10MB)
                    </Typography>
                    <Button variant="outlined" component="span">
                      Datei auswählen
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileInputChange}
                    />
                  </Box>

                  {selectedFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Dateigröße: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}

                  {uploadProgress > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Upload: {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </GlassCard>
            </Grid>

            {/* Document Details */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Dokumenttyp</InputLabel>
                    <Select
                      {...field}
                      value={field.value || ''}
                      label="Dokumenttyp"
                      onChange={event => field.onChange(event.target.value)}
                      disabled={loadingTypes}
                    >
                      {documentTypes.map(type => (
                        <MenuItem key={type.id} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                    {loadingTypes && <FormHelperText>Lade Dokumententypen...</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('name')}
                label="Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('expiryDate')}
                label="Ablaufdatum (optional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.expiryDate}
                helperText={errors.expiryDate?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                {...register('notes')}
                label="Notizen (optional)"
                multiline
                rows={3}
                fullWidth
                placeholder="Zusätzliche Informationen..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isLoading || !selectedFile}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Upload...' : 'Hochladen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
