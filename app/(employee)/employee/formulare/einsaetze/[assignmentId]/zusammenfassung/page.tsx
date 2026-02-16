'use client';

import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, shiftService } from '@/lib/services';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { addDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';

export default function AssignmentSummaryPage() {
  const { assignmentId } = useParams() as { assignmentId: string };
  const { loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signatureName, setSignatureName] = useState('');
  const [block, setBlock] = useState<
    Array<{ assignmentId: string; date: Date; startTime: string; endTime: string }>
  >([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const a = await assignmentService.getById(assignmentId);
        if (!a) {
          setError('Zuweisung nicht gefunden');
          setLoading(false);
          return;
        }
        const s = await shiftService.getById(a.shiftId);
        if (!s) {
          setError('Schicht nicht gefunden');
          setLoading(false);
          return;
        }
        const date = new Date(s.date);
        const from = addDays(date, -14);
        const to = addDays(date, 14);
        const list = await assignmentService.getByUserAndDateRange(a.userId, from, to);
        const items: Array<{
          assignmentId: string;
          date: Date;
          startTime: string;
          endTime: string;
        }> = [];
        for (const it of list) {
          const sh = await shiftService.getById(it.shiftId);
          if (!sh) continue;
          const d = new Date(sh.date);
          if (d >= from && d <= to)
            items.push({
              assignmentId: it.id,
              date: d,
              startTime: sh.startTime,
              endTime: sh.endTime,
            });
        }
        items.sort((x, y) => x.date.getTime() - y.date.getTime());
        if (!mounted) return;
        setBlock(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [assignmentId]);

  const handleFinalize = async () => {
    try {
      setSaving(true);
      // Final-Signatur setzen
      for (const item of block) {
        await assignmentService.update(item.assignmentId, {
          finalSummarySignedBy: signatureName,
          finalSummarySignedAt: new Date(),
        });
      }

      // Prüfen, ob alle Tage eine tägliche Signatur haben; wenn ja, auf completed setzen
      for (const item of block) {
        const a = await assignmentService.getById(item.assignmentId);
        if (!a) continue;
        const dateKey = item.date.toISOString().slice(0, 10);
        const daily = a.dailySignatures || [];
        const hasDaily =
          Array.isArray(daily) &&
          daily.some((s: { date: string; name: string; signedAt: Date }) => s.date === dateKey);
        if (hasDaily) {
          await assignmentService.update(item.assignmentId, {
            status: 'completed',
            completedAt: new Date(),
          });
        }
      }
      toast.success('Finale Zusammenfassung unterschrieben. Vielen Dank!');
      router.back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
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

  return (
    <Box sx={{ maxWidth: 840, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Finalzusammenfassung – Zeitenübersicht
      </Typography>

      <Card className="glass" sx={{ mb: 3 }}>
        <CardContent>
          {block.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Dienste im Zeitraum gefunden.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {block.map(item => (
                <Box
                  key={`${item.assignmentId}-${item.date.toISOString()}`}
                  sx={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">
                    {format(item.date, 'EEE dd.MM.yyyy', { locale: de })}
                  </Typography>
                  <Typography variant="body2">
                    {item.startTime} – {item.endTime}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Bitte prüfen Sie die aufgeführten Zeiten und bestätigen Sie mit Ihrer Unterschrift.
            </Alert>
            <TextField
              label="Name der unterschriftsberechtigten Person"
              value={signatureName}
              onChange={e => setSignatureName(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => router.back()} disabled={saving}>
                Abbrechen
              </Button>
              <Button
                variant="contained"
                onClick={handleFinalize}
                disabled={saving || !signatureName}
              >
                Final unterschreiben
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
