'use client';

import { useEffect, useState } from 'react';
import { offlineQueueService, OfflineConflict, OFFLINE_CONFLICT_EVENT } from '@/lib/services/offlineQueue';

export function useOfflineConflicts() {
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  useEffect(() => {
    // Load initial conflicts
    setConflicts(offlineQueueService.getConflicts());

    // Listen for new conflicts
    const handleConflict = (event: Event) => {
      const customEvent = event as CustomEvent<OfflineConflict>;
      setConflicts((prev) => {
        const existing = prev.find((c) => c.itemId === customEvent.detail.itemId);
        if (existing) {
          return prev.map((c) => (c.itemId === customEvent.detail.itemId ? customEvent.detail : c));
        }
        return [...prev, customEvent.detail];
      });
    };

    window.addEventListener(OFFLINE_CONFLICT_EVENT, handleConflict);

    return () => {
      window.removeEventListener(OFFLINE_CONFLICT_EVENT, handleConflict);
    };
  }, []);

  const resolveConflict = async (itemId: string, deleteItem: boolean = true) => {
    await offlineQueueService.resolveConflict(itemId, deleteItem);
    setConflicts((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const retryConflict = async (itemId: string) => {
    await offlineQueueService.retryConflictItem(itemId);
    setConflicts((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const hasConflicts = conflicts.length > 0;

  return {
    conflicts,
    hasConflicts,
    resolveConflict,
    retryConflict,
  };
}
