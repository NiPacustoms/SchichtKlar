'use client';

import { logger } from '@/lib/logging';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { useAuth } from '@/contexts/AuthContext';

interface VacationRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    startDate: Date;
    endDate: Date;
    reason: string;
    employeeName: string;
    employeeSignatureUrl: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
  employeeName: string;
}

export function VacationRequestForm({ open, onClose, onSubmit, isLoading = false }: VacationRequestFormProps) {
  const { user } = useAuth();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      startDate: null,
      endDate: null,
      reason: '',
      employeeName: user?.displayName || '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const handleClose = () => {
    reset();
    setSignatureDataUrl(null);
    setSignatureError(null);
    onClose();
  };

  const handleSignatureSave = async (dataUrl: string) => {
    try {
      // Konvertiere Data URL zu Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });
      
      // Upload zur Firebase Storage
      const uploadResult = await firebaseStorageService.uploadFile(
        file,
        `signatures/vacation/${user?.id || 'unknown'}/${Date.now()}.png`
      );
      
      setSignatureDataUrl(uploadResult.url);
      setSignatureOpen(false);
      setSignatureError(null);
    } catch (error) {
      logger.error('Fehler beim Speichern der Unterschrift:', error);
      setSignatureError('Fehler beim Speichern der Unterschrift. Bitte versuchen Sie es erneut.');
    }
  };

  const onFormSubmit = handleSubmit(async (formData) => {
    if (!formData.startDate || !formData.endDate) {
      return;
    }

    if (!signatureDataUrl) {
      setSignatureOpen(true);
      return;
    }

    try {
      await onSubmit({
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        employeeName: formData.employeeName,
        employeeSignatureUrl: signatureDataUrl,
      });
      handleClose();
    } catch (error) {
      logger.error('Fehler beim Einreichen des Urlaubsantrags:', error);
    }
  });

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    if (endDate < startDate) return 0;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '20px' }}>
            Urlaubsantrag einreichen
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    control={control}
                    name="employeeName"
                    rules={{ required: 'Name ist erforderlich' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Name"
                        required
                        error={!!errors.employeeName}
                        helperText={errors.employeeName?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="startDate"
                    rules={{
                      required: 'Startdatum ist erforderlich',
                      validate: (value) => {
                        if (!value) return 'Startdatum ist erforderlich';
                        if (value < new Date(new Date().setHours(0, 0, 0, 0))) {
                          return 'Startdatum darf nicht in der Vergangenheit liegen';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Von"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.startDate,
                            helperText: errors.startDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="endDate"
                    rules={{
                      required: 'Enddatum ist erforderlich',
                      validate: (value) => {
                        if (!value) return 'Enddatum ist erforderlich';
                        if (startDate && value < startDate) {
                          return 'Enddatum muss nach dem Startdatum liegen';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Bis"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.endDate,
                            helperText: errors.endDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Urlaubszeitraum:</strong> {calculateDays()} Tag{calculateDays() !== 1 ? 'e' : ''}
                    </Typography>
                  </Alert>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    control={control}
                    name="reason"
                    rules={{ required: 'Grund ist erforderlich' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Grund (optional)"
                        multiline
                        rows={3}
                        error={!!errors.reason}
                        helperText={errors.reason?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Unterschrift
                      </Typography>
                      {signatureDataUrl ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Alert severity="success" sx={{ flex: 1 }}>
                            Unterschrift wurde gespeichert
                          </Alert>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSignatureDataUrl(null);
                              setSignatureOpen(true);
                            }}
                          >
                            Ändern
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => setSignatureOpen(true)}
                        >
                          Unterschrift hinzufügen
                        </Button>
                      )}
                      {signatureError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {signatureError}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onFormSubmit}
            variant="contained"
            disabled={isLoading || !signatureDataUrl}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {isLoading ? 'Wird eingereicht...' : 'Urlaubsantrag einreichen'}
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureOpen}
        title="Ihre Unterschrift"
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        requireName={false}
      />
    </>
  );
}

