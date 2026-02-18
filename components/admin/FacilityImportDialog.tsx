'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Upload, Download } from '@mui/icons-material';
import { auth } from '@/lib/firebase';
import { toast } from '@/lib/utils/toast';

const CSV_TEMPLATE_HEADER = 'Name,Adresse,Ansprechpartner,Telefon,E-Mail,Debitornummer,Farbe,Typ';
const CSV_TEMPLATE_ROW = 'Pflegeheim Muster,Musterstr. 1,Herr Müller,030 123456,info@muster.de,DEB001,#4CAF50,Pflegeheim';

interface FacilityImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FacilityImportDialog({ open, onClose, onSuccess }: FacilityImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
  };

  const handleDownloadTemplate = () => {
    const csv = [CSV_TEMPLATE_HEADER, CSV_TEMPLATE_ROW].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'einrichtungen_import_vorlage.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Bitte eine CSV-Datei auswählen');
      return;
    }
    if (!auth) {
      toast.error('Nicht angemeldet');
      return;
    }
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      toast.error('Nicht angemeldet');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/admin/import/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Import fehlgeschlagen');
        setResult({ created: 0, errors: [{ row: 0, message: data.error || res.statusText }] });
        return;
      }
      setResult({ created: data.created ?? 0, errors: data.errors ?? [] });
      if ((data.created ?? 0) > 0) {
        toast.success(`${data.created} Einrichtungen angelegt`);
        onSuccess?.();
      }
    } catch (_e) {
      toast.error(_e instanceof Error ? _e.message : 'Import fehlgeschlagen');
      setResult({ created: 0, errors: [{ row: 0, message: String(_e) }] });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    if (inputRef.current?.value) inputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Einrichtungen importieren</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          CSV mit Spalten: Name, Adresse, Ansprechpartner, Telefon, E-Mail, Debitornummer (optional: Farbe, Typ).
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadTemplate} size="small">
            Vorlage herunterladen
          </Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} style={{ display: 'none' }} />
          <Button variant="outlined" component="label" startIcon={<Upload />} disabled={loading}>
            {file ? file.name : 'CSV-Datei wählen'}
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
          </Button>
          {result && (
            <>
              <Alert severity={result.errors.length > 0 ? (result.created > 0 ? 'warning' : 'error') : 'success'}>
                {result.created} Einrichtungen angelegt.
                {result.errors.length > 0 && ` ${result.errors.length} Fehler.`}
              </Alert>
              {result.errors.length > 0 && (
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {result.errors.slice(0, 20).map((err, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={`Zeile ${err.row}: ${err.message}`} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                  {result.errors.length > 20 && (
                    <ListItem>
                      <ListItemText primary={`… und ${result.errors.length - 20} weitere Fehler`} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  )}
                </List>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Schließen</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!file || loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
          {loading ? 'Importiere…' : 'Importieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
