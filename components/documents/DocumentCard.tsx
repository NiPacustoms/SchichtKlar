'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Document } from '@/lib/types';
import { Delete, Download, Edit, MoreVert, Visibility } from '@mui/icons-material';
import { Box, Button, Chip, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';

interface ExtendedDocument extends Document {
  status?: string;
  expiryDate?: Date | string;
  uploadedAt?: Date | string;
  notes?: string;
}

interface DocumentCardProps {
  document: ExtendedDocument;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  onDownload?: (document: Document) => void;
  onView?: (document: Document) => void;
  onVerify?: (documentId: string) => void;
  onReject?: (documentId: string) => void;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
  getStatusLabel: (status: string) => string;
  getDocumentTypeColor: (type: string) => string;
  formatFileSize: (bytes: number) => string;
}

export function DocumentCard({
  document,
  onEdit,
  onDelete,
  onDownload,
  onView,
  onVerify: _onVerify,
  onReject: _onReject,
  getStatusColor,
  getStatusLabel,
  getDocumentTypeColor,
  formatFileSize,
}: DocumentCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const documentStatus = document.status || 'unknown';
  const status = getStatusColor(documentStatus);
  const statusLabel = getStatusLabel(documentStatus);
  const typeColor = getDocumentTypeColor(document.type);

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {document.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {document.type} • {formatFileSize(document.fileSize)}
            </Typography>
            {document.expiryDate && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Gültig bis: {format(new Date(document.expiryDate), 'dd.MM.yyyy')}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: typeColor,
                }}
              />
              <Typography variant="body2" sx={{ color: typeColor }}>
                {document.type}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={statusLabel}
              color={status}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '12px',
                height: 28,
              }}
            />
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                ml: 1,
                border: '1.5px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(0,95,115,0.06)',
                  color: 'primary.main',
                },
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {document.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {document.notes}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Hochgeladen:{' '}
            {document.uploadedAt
              ? format(new Date(document.uploadedAt), 'dd.MM.yyyy')
              : format(document.createdAt, 'dd.MM.yyyy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onView && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Visibility />}
                onClick={() => onView(document)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderWidth: 1.5,
                }}
              >
                Ansehen
              </Button>
            )}
            {onDownload && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={() => onDownload(document)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderWidth: 1.5,
                }}
              >
                Download
              </Button>
            )}
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,95,115,0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              mt: 1,
            },
          }}
        >
          {onView && (
            <MenuItem onClick={() => handleAction(() => onView(document))}>
              <Visibility sx={{ mr: 1 }} />
              Ansehen
            </MenuItem>
          )}
          {onDownload && (
            <MenuItem onClick={() => handleAction(() => onDownload(document))}>
              <Download sx={{ mr: 1 }} />
              Download
            </MenuItem>
          )}
          {onEdit && (
            <MenuItem onClick={() => handleAction(() => onEdit(document))}>
              <Edit sx={{ mr: 1 }} />
              Bearbeiten
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem
              onClick={() => handleAction(() => onDelete(document.id))}
              sx={{ color: 'error.main' }}
            >
              <Delete sx={{ mr: 1 }} />
              Löschen
            </MenuItem>
          )}
        </Menu>
      </Box>
    </GlassCard>
  );
}
