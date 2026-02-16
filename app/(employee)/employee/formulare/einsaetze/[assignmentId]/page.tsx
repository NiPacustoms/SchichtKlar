'use client';

import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, shiftService, facilityService, documentService } from '@/lib/services';
import { documentGenerationService } from '@/lib/services/documentGeneration';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AccessTime, LocationOn, Person } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { AppLogo } from '@/components/ui/AppLogo';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignatureDialog } from '@/components/ui/SignatureDialog';

const assignmentFormSchema = z
  .object({
    mode: z.enum(['acknowledge', 'decline']),
    notes: z.string().max(1000).optional(),
    declineDate: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'decline' && !values.declineDate?.trim()) {
      ctx.addIssue({
        path: ['declineDate'],
        message: 'Ablehnungsdatum ist erforderlich',
        code: z.ZodIssueCode.custom,
      });
    }
  });

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export default function AssignmentFormPage() {
  const { assignmentId } = useParams() as { assignmentId: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { branding } = useBrandingSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signerName, setSignerName] = useState<string>('');
  const [stationName, setStationName] = useState<string>('');

  const [assignment, setAssignment] = useState<Awaited<
    ReturnType<typeof assignmentService.getById>
  > | null>(null);
  const [shift, setShift] = useState<Awaited<ReturnType<typeof shiftService.getById>> | null>(null);
  const [facility, setFacility] = useState<Awaited<
    ReturnType<typeof facilityService.getById>
  > | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      mode: 'acknowledge',
      notes: '',
      declineDate: '',
    },
  });

  const mode = watch('mode');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const a = await assignmentService.getById(assignmentId);
        if (!a) {
          setError('Zuweisung nicht gefunden');
          setLoading(false);
          return;
        }
        if (!isMounted) return;
        setAssignment(a);

        const s = await shiftService.getById(a.shiftId);
        if (!isMounted) return;
        setShift(s);

        // Lade Facility-Daten
        if (s?.facilityId) {
          const f = await facilityService.getById(s.facilityId);
          if (isMounted) {
            setFacility(f);
            // Lade Station-Name
            if (f && s.stationId) {
              const station = f.stations?.find(st => st.id === s.stationId);
              setStationName(station?.name || '');
            }
          }
        }

        reset({
          mode: 'acknowledge',
          notes: '',
          declineDate: new Date().toISOString().split('T')[0], // Heute als Standard
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [assignmentId, reset]);

  const isDisabled = useMemo(
    () => saving || loading || !!error || isSubmitting,
    [saving, loading, error, isSubmitting]
  );

  // Generiere PDF und speichere als Dokument
  const generateAndSaveDocument = async (
    isDeclined: boolean,
    signatureDataUrl?: string,
    declineReason?: string
  ) => {
    if (!assignment || !shift || !user) {
      throw new Error('Fehlende Daten für Dokumentenerstellung');
    }

    const employeeName = user.displayName || user.email || 'Unbekannt';
    const facilityName = facility?.name || shift.facilityId || 'Unbekannt';
    const facilityAddress = facility?.address || '';
    const shiftTimes = `${shift.startTime} - ${shift.endTime}`;
    const currentDate = new Date();

    // Generiere PDF mit Branding
    const pdfResult = await documentGenerationService.generateDocument({
      type: 'assignment-notification',
      assignmentId: assignment.id,
      userId: user.id,
      assignmentNotificationData: {
        employeeName,
        facilityName,
        facilityAddress,
        shiftTimes,
        date: currentDate,
        isDeclined,
        signatureDataUrl,
        declineReason,
        branding: {
          companyName: branding?.companyName,
          companyLogo: branding?.companyLogo,
        },
      },
    });

    // Speichere als Dokument für Mitarbeiter
    await documentService.create({
      userId: user.id,
      type: 'contract',
      name: `Einsatzmitteilung ${isDeclined ? '(Ablehnung)' : '(Bestätigung)'} - ${currentDate.toLocaleDateString('de-DE')}`,
      url: pdfResult.url,
      fileSize: pdfResult.fileSize,
      mimeType: 'application/pdf',
      notes: `Einsatzmitteilung für Assignment ${assignment.id}`,
    });

    // Speichere auch für Admin (falls Admin-ID verfügbar)
    // TODO: Admin-ID aus Assignment oder System holen
    // Für jetzt: Dokument ist über getAll() für Admins verfügbar (filtert nach companyId)

    return pdfResult;
  };

  const onSubmit = handleSubmit(async formValues => {
    if (!assignment || !shift || !user) return;

    try {
      setSaving(true);

      if (formValues.mode === 'acknowledge') {
        // Bei Annahme: Keine Unterschrift erforderlich
        await assignmentService.update(assignment.id, {
          formStatus: 'acknowledged',
          formPlace: facility?.name || shift.facilityId || '',
          formTimes: `${shift.startTime} - ${shift.endTime}`,
          formNotes: formValues.notes?.trim() || undefined,
          formSignatureName: user.displayName || undefined,
          formSignedAt: new Date(),
          status: assignment.status === 'assigned' ? 'accepted' : assignment.status,
          acceptedAt: new Date(),
          decidedAt: new Date(),
        });

        // Generiere PDF ohne Unterschrift
        await generateAndSaveDocument(false);

        toast.success('Einsatzmitteilung bestätigt. Danke!');
      } else {
        // Bei Ablehnung: Unterschrift erforderlich
        if (!signatureDataUrl) {
          setSignatureOpen(true);
          return; // Warte auf Unterschrift
        }

        await assignmentService.update(assignment.id, {
          formStatus: 'declined',
          declineReason: formValues.notes?.trim() || 'Ablehnung ohne Begründung',
          status: 'declined',
          declinedAt: new Date(formValues.declineDate!),
          decidedAt: new Date(),
        });

        // Generiere PDF mit Unterschrift
        await generateAndSaveDocument(
          true,
          signatureDataUrl,
          formValues.notes?.trim() || undefined
        );

        toast.success('Dienst wurde abgelehnt.');
      }

      router.back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  });

  const handleSignatureSave = (dataUrl: string, name?: string) => {
    setSignatureDataUrl(dataUrl);
    setSignerName(name || user?.displayName || '');
    setSignatureOpen(false);

    // Nach Unterschrift automatisch absenden
    if (mode === 'decline') {
      setTimeout(() => {
        handleSubmit(async formValues => {
          if (!assignment || !shift || !user) return;

          try {
            setSaving(true);
            await assignmentService.update(assignment.id, {
              formStatus: 'declined',
              declineReason: formValues.notes?.trim() || 'Ablehnung ohne Begründung',
              status: 'declined',
              declinedAt: new Date(formValues.declineDate!),
              decidedAt: new Date(),
            });

            await generateAndSaveDocument(true, dataUrl, formValues.notes?.trim() || undefined);
            toast.success('Dienst wurde abgelehnt.');
            router.back();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern');
          } finally {
            setSaving(false);
          }
        })();
      }, 100);
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const employeeName = user?.displayName || user?.email || 'Unbekannt';
  const facilityName = facility?.name || shift?.facilityId || 'Unbekannt';
  const facilityAddress = facility?.address || '';
  const shiftTimes = shift ? `${shift.startTime} - ${shift.endTime}` : '-';
  const currentDate = new Date().toLocaleDateString('de-DE');

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
      {/* Branding-Logo oben */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AppLogo
          branding={branding}
          showLogo={branding?.showLogo !== false}
          width={120}
          height={120}
          sx={{ width: 120, height: 120 }}
          showSkeleton={false}
          fallbackBgColor="transparent"
        />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG / Ablehnung
      </Typography>

      {shift && (
        <Card className="glass" sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1.5, fontWeight: 600 }}
            >
              Schichtdetails
            </Typography>

            {/* Geplante Arbeitszeiten */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1">
                {shift.type || 'Schicht'} •{' '}
                {typeof shift.date === 'string'
                  ? shift.date
                  : (shift.date as Date)?.toLocaleDateString?.('de-DE') || String(shift.date)}{' '}
                • {shift.startTime} - {shift.endTime}
              </Typography>
            </Stack>

            {/* Einrichtung und Station */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {facilityName}
                {stationName && ` - ${stationName}`}
                {facilityAddress ? `, ${facilityAddress}` : ''}
              </Typography>
            </Stack>

            {/* Ansprechpartner */}
            {facility?.contactPerson && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Ansprechpartner: {facility.contactPerson}
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="glass" sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <RadioGroup
              row
              value={mode}
              onChange={e => {
                setValue('mode', e.target.value as AssignmentFormValues['mode']);
                setSignatureDataUrl(null); // Reset Unterschrift bei Moduswechsel
              }}
            >
              <FormControlLabel
                value="acknowledge"
                control={<Radio />}
                label="Einsatz bestätigen"
              />
              <FormControlLabel value="decline" control={<Radio />} label="Dienst ablehnen" />
            </RadioGroup>

            {/* Automatisch ausgefüllte Informationen */}
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Mitarbeiter:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {employeeName}
              </Typography>

              {mode === 'acknowledge' && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Einsatzort:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {facilityName}
                    {facilityAddress ? `, ${facilityAddress}` : ''}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Einsatzzeiten:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {shiftTimes}
                  </Typography>
                </>
              )}
            </Card>

            {mode === 'acknowledge' ? (
              <Stack spacing={2}>
                <Typography variant="body2">
                  Hiermit setzte ich Sie in Kenntnis, dass Sie als Zeitarbeitnehmer für die AufAbruf
                  GmbH tätig werden.
                </Typography>

                <Alert severity="info">
                  Bitte denken Sie daran, die Einsatzzeit mittels den zur Verfügung gestellten
                  Zeiterfassungsbögen zu dokumentieren und vom Berechtigten am Einsatzort
                  unterschreiben zu lassen. Die Zeiterfassungsbögen müssen wöchentlich an die
                  AufAbruf GmbH Zentrale übermittelt werden.
                </Alert>
                <Alert severity="warning">
                  Bitte denken Sie an entsprechende Arbeitsschutzkleidung (Kasack, festes Schuhwerk)
                  und achten die Hygienevorschriften sowie den zur Verfügung gestellten
                  Hautschutzplan.
                </Alert>

                <TextField
                  label="Anmerkungen (optional)"
                  fullWidth
                  multiline
                  minRows={2}
                  {...register('notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />

                <TextField
                  label="Datum"
                  value={currentDate}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2">Ablehnung der angeforderten Dienste</Typography>
                <Typography variant="body2">
                  Hiermit lehne ich den angeforderten Dienst ab. Mir ist bewusst, dass mir diese
                  Zeit von meiner vertraglich vereinbarten Betriebszeit in Abzug gebracht wird.
                </Typography>
                <TextField
                  label="Begründung (optional)"
                  fullWidth
                  multiline
                  minRows={2}
                  {...register('notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
                <TextField
                  label="Ablehnungsdatum"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register('declineDate')}
                  error={!!errors.declineDate}
                  helperText={errors.declineDate?.message}
                />

                {signatureDataUrl && <Alert severity="success">Unterschrift wurde erfasst.</Alert>}
              </Stack>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => router.back()} disabled={isDisabled}>
                Abbrechen
              </Button>
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={isDisabled || (mode === 'decline' && !signatureDataUrl)}
              >
                {mode === 'acknowledge' ? 'Bestätigen' : 'Ablehnen'}
              </Button>
            </Stack>

            {mode === 'decline' && !signatureDataUrl && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setSignatureOpen(true)}
                disabled={isDisabled}
                fullWidth
              >
                Unterschrift erfassen
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <SignatureDialog
        open={signatureOpen}
        title="Unterschrift zur Ablehnung"
        onClose={() => setSignatureOpen(false)}
        onSave={handleSignatureSave}
        requireName={true}
        nameLabel="Ihr Name"
        initialName={user?.displayName || ''}
      />
    </Box>
  );
}
