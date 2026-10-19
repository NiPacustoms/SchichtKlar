'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ContentCopyRounded, MailOutlineRounded } from '@mui/icons-material';
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { Facility } from '@/lib/types';
import {
  approvalErrorMessage,
  facilityApprovalService,
  type CreatedLink,
} from '@/lib/services/facilityApproval';
import { toast } from '@/lib/utils/toast';

const key = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * Erzeugt einen Freigabe-Link für eine Einrichtung und einen Zeitraum. Die
 * Pflegedienstleitung bestätigt damit ohne eigenes Konto.
 */
export function FacilityApprovalLinkDialog({
  open,
  onClose,
  facilities,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  facilities: Facility[];
  companyName?: string;
}) {
  const lastWeek = addWeeks(new Date(), -1);
  const [facilityId, setFacilityId] = useState('');
  const [from, setFrom] = useState(key(startOfWeek(lastWeek, { weekStartsOn: 1 })));
  const [to, setTo] = useState(key(endOfWeek(lastWeek, { weekStartsOn: 1 })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<CreatedLink | null>(null);

  useEffect(() => {
    if (!open) {
      setLink(null);
      setError(null);
    }
  }, [open]);

  const facility = facilities.find(f => f.id === facilityId);
  const url = link ? facilityApprovalService.urlFor(link.token) : '';

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      setLink(await facilityApprovalService.createLink(facilityId, from, to));
    } catch (e) {
      setError(approvalErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const period = `${format(new Date(from), 'dd.MM.')}–${format(new Date(to), 'dd.MM.yyyy')}`;
  const mailto = link
    ? `mailto:${encodeURIComponent(link.facilityEmail ?? '')}?subject=${encodeURIComponent(
        `Stundennachweis ${facility?.name ?? ''} ${period}`
      )}&body=${encodeURIComponent(
        `Guten Tag${link.facilityContact ? ` ${link.facilityContact}` : ''},\n\nbitte bestätigen Sie die Arbeitszeiten unserer Mitarbeitenden in Ihrer Einrichtung für ${period}:\n\n${url}\n\nDer Link ist bis ${format(new Date(link.expiresAt), 'd. MMMM yyyy', { locale: de })} gültig und ohne Anmeldung nutzbar. Einzelne Dienste können Sie dort auch beanstanden.\n\nVielen Dank\n${companyName ?? ''}`
      )}`
    : '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Freigabe bei der Einrichtung anfragen</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {!link ? (
          <>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Die Einrichtung erhält einen Link, über den sie die erfassten Dienste des Zeitraums ohne Anmeldung bestätigt oder
              einzelne beanstandet. Der Link ist 14 Tage gültig.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="fa-facility">Einrichtung</InputLabel>
              <Select labelId="fa-facility" label="Einrichtung" value={facilityId} onChange={e => setFacilityId(String(e.target.value))}>
                {facilities.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <TextField type="date" label="Von" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="Bis" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
          </>
        ) : (
          <>
            <Alert severity={link.pending ? 'success' : 'info'}>
              {link.pending
                ? `${link.pending} ${link.pending === 1 ? 'Dienst wartet' : 'Dienste warten'} auf Bestätigung durch ${facility?.name}.`
                : `Im Zeitraum gibt es keine offenen Dienste – der Link zeigt nur bereits Bestätigtes.`}
            </Alert>
            <TextField
              label="Link für die Einrichtung"
              value={url}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Kopieren">
                      <IconButton
                        aria-label="Link kopieren"
                        onClick={() => navigator.clipboard?.writeText(url).then(() => toast.success('Link kopiert'))}
                      >
                        <ContentCopyRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              onFocus={e => e.target.select()}
            />
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Gültig bis {format(new Date(link.expiresAt), 'd. MMMM yyyy', { locale: de })}. Wer den Link hat, kann bestätigen – bitte
              nur an die zuständige Leitung senden.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>{link ? 'Schließen' : 'Abbrechen'}</Button>
        {!link ? (
          <Button variant="contained" disabled={!facilityId || !from || !to || busy} onClick={create}>
            {busy ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : 'Link erstellen'}
          </Button>
        ) : (
          <Button variant="contained" startIcon={<MailOutlineRounded />} component="a" href={mailto}>
            {link.facilityEmail ? 'Per E-Mail senden' : 'E-Mail vorbereiten'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default FacilityApprovalLinkDialog;
