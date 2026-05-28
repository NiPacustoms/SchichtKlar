'use client';

import { useState } from 'react';
import { OfflineConflictDialog } from './OfflineConflictDialog';
import { useOfflineConflicts } from '@/lib/hooks/useOfflineConflicts';

export function OfflineConflictContainer() {
  const { conflicts, resolveConflict, retryConflict } = useOfflineConflicts();
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentConflict = conflicts[currentIndex] || null;

  const handleResolve = async (deleteItem: boolean) => {
    if (!currentConflict) return;
    setLoading(true);
    try {
      await resolveConflict(currentConflict.itemId, deleteItem);
      // Move to next conflict or close
      if (currentIndex < conflicts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!currentConflict) return;
    setLoading(true);
    try {
      await retryConflict(currentConflict.itemId);
      // Move to next conflict or close
      if (currentIndex < conflicts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OfflineConflictDialog
      open={currentConflict !== null}
      conflict={currentConflict}
      onResolve={handleResolve}
      onRetry={handleRetry}
      loading={loading}
    />
  );
}
