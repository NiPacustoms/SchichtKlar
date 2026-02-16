'use client';

import React from 'react';
import type { DialogProps } from '@/lib/types';

export const Dialog: React.FC<DialogProps> = ({ open, isOpen, onClose, title, children }) => {
  const isDialogOpen = isOpen ?? open;

  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-slate-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Dialog schließen"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Dialog;
