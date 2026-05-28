'use client';

import { Chip, Tooltip, CircularProgress } from '@mui/material';
import { CloudOff, CheckCircle, Schedule } from '@mui/icons-material';
import { useOfflineSync } from '@/lib/hooks/useOfflineSync';

/**
 * Zeigt den Offline-/Sync-Status der Zeiterfassung (IndexedDB-Queue).
 * Nutzbar auf der Zeiterfassungs-Seite oder im Layout.
 */
export function SyncStatusIndicator({ hideWhenSynced = false }: { hideWhenSynced?: boolean }) {
  const { pendingCount, isSyncing, status } = useOfflineSync();

  if (status === 'offline') {
    return (
      <Tooltip title="Offline – Zeiterfassungen werden beim nächsten Verbindungswiederaufbau synchronisiert.">
        <Chip
          size="small"
          icon={<CloudOff />}
          label={pendingCount > 0 ? `${pendingCount} ausstehend` : 'Offline'}
          color="warning"
          variant="outlined"
          aria-label="Status: Offline"
        />
      </Tooltip>
    );
  }

  if (isSyncing) {
    return (
      <Tooltip title="Synchronisiere ausstehende Zeiterfassungen…">
        <Chip
          size="small"
          icon={<CircularProgress size={14} color="inherit" />}
          label="Synchronisiere…"
          color="info"
          variant="outlined"
          aria-label="Status: Wird synchronisiert"
        />
      </Tooltip>
    );
  }

  if (pendingCount > 0) {
    return (
      <Tooltip title={`${pendingCount} Zeiterfassung(en) warten auf Synchronisation. Bei Internetverbindung wird automatisch synchronisiert.`}>
        <Chip
          size="small"
          icon={<Schedule />}
          label={`${pendingCount} ausstehend`}
          color="warning"
          variant="outlined"
          aria-label={`${pendingCount} ausstehend`}
        />
      </Tooltip>
    );
  }

  if (hideWhenSynced) return null;

  return (
    <Tooltip title="Alle Zeiterfassungen sind synchronisiert.">
      <Chip
        size="small"
        icon={<CheckCircle />}
        label="Synchronisiert"
        color="success"
        variant="outlined"
        aria-label="Status: Synchronisiert"
      />
    </Tooltip>
  );
}
