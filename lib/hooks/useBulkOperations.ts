'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';

export interface BulkOperation<T> {
  id: string;
  label: string;
  action: (items: T[]) => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  icon?: React.ReactNode;
}

export interface BulkOperationState<T> {
  selectedItems: T[];
  isSelecting: boolean;
  isProcessing: boolean;
  operations: BulkOperation<T>[];
}

export function useBulkOperations<T extends { id: string }>(
  operations: BulkOperation<T>[],
  onSuccess?: () => void
) {
  const [state, setState] = useState<BulkOperationState<T>>({
    selectedItems: [],
    isSelecting: false,
    isProcessing: false,
    operations,
  });

  const toggleSelection = useCallback((item: T) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.find(selected => selected.id === item.id)
        ? prev.selectedItems.filter(selected => selected.id !== item.id)
        : [...prev.selectedItems, item],
    }));
  }, []);

  const toggleSelectAll = useCallback((items: T[]) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.length === items.length ? [] : items,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: [],
    }));
  }, []);

  const executeOperation = useCallback(async (operation: BulkOperation<T>) => {
    if (state.selectedItems.length === 0) {
      toast.error('Keine Elemente ausgewählt');
      return;
    }

    if (operation.requiresConfirmation) {
      const confirmed = window.confirm(
        operation.confirmationMessage || 
        `Sind Sie sicher, dass Sie diese Aktion für ${state.selectedItems.length} Elemente ausführen möchten?`
      );
      
      if (!confirmed) return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      await operation.action(state.selectedItems);
      toast.success(`${operation.label} erfolgreich für ${state.selectedItems.length} Elemente ausgeführt`);
      clearSelection();
      onSuccess?.();
    } catch (error) {
      toast.error(`Fehler bei ${operation.label}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.selectedItems, clearSelection, onSuccess]);

  const toggleSelecting = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSelecting: !prev.isSelecting,
      selectedItems: prev.isSelecting ? [] : prev.selectedItems,
    }));
  }, []);

  const isSelected = useCallback((item: T) => {
    return state.selectedItems.some(selected => selected.id === item.id);
  }, [state.selectedItems]);

  const isAllSelected = useCallback((items: T[]) => {
    return items.length > 0 && state.selectedItems.length === items.length;
  }, [state.selectedItems]);

  const isPartiallySelected = useCallback((items: T[]) => {
    return state.selectedItems.length > 0 && state.selectedItems.length < items.length;
  }, [state.selectedItems]);

  return {
    ...state,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    executeOperation,
    toggleSelecting,
    isSelected,
    isAllSelected,
    isPartiallySelected,
  };
}

// Utility functions for common bulk operations
export const createBulkDeleteOperation = <T extends { id: string }>(
  deleteFunction: (ids: string[]) => Promise<void>,
  itemName: string = 'Elemente'
): BulkOperation<T> => ({
  id: 'bulk-delete',
  label: 'Löschen',
  action: async (items) => {
    await deleteFunction(items.map(item => item.id));
  },
  requiresConfirmation: true,
  confirmationMessage: `Sind Sie sicher, dass Sie diese ${itemName} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`,
});

export const createBulkStatusUpdateOperation = <T extends { id: string }>(
  updateFunction: (ids: string[], status: string) => Promise<void>,
  status: string,
  statusLabel: string
): BulkOperation<T> => ({
  id: `bulk-status-${status}`,
  label: `Status auf ${statusLabel} setzen`,
  action: async (items) => {
    await updateFunction(items.map(item => item.id), status);
  },
  requiresConfirmation: true,
  confirmationMessage: `Sind Sie sicher, dass Sie den Status der ausgewählten Elemente auf "${statusLabel}" setzen möchten?`,
});

export const createBulkExportOperation = <T extends { id: string }>(
  exportFunction: (items: T[]) => Promise<void>,
  format: string = 'CSV'
): BulkOperation<T> => ({
  id: 'bulk-export',
  label: `${format} Export`,
  action: exportFunction,
  requiresConfirmation: false,
});
