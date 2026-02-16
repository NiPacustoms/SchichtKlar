'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Globale Suche in der Topbar (DS: „Topbar: Suche, globale Aktionen, User-Menü“).
 * Öffnet ein Dialog mit Suchfeld; Enter navigiert zu einer Suchseite oder führt Suche aus.
 */
export function GlobalSearchDialog({ open, onClose }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    onClose();
    setQuery('');
    const basePath =
      user?.role === 'nurse'
        ? '/employee/arbeitsplatz'
        : user?.role === 'admin'
          ? '/admin/uebersicht'
          : '/';
    router.push(`${basePath}?search=${encodeURIComponent(q)}`);
  }, [query, onClose, router, user?.role]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          mt: isMobile ? 0 : '10vh',
        },
      }}
      aria-label="Globale Suche"
    >
      <DialogTitle
        sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h6" component="span">
          Suche
        </Typography>
        <IconButton onClick={handleClose} aria-label="Suche schließen" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, pb: 2 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Mitarbeiter, Einrichtungen, Einsätze…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            inputProps={{
              'aria-label': 'Suchbegriff eingeben',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Suche nach Mitarbeitern, Einrichtungen oder Einsätzen. Enter zum Suchen.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
