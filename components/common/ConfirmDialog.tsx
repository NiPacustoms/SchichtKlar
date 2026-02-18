'use client';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
export default function ConfirmDialog({
  open,
  title,
  content,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  loading = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  content?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      sx={isMobile ? { '& .MuiDialog-container': { alignItems: 'flex-end' } } : undefined}
      PaperProps={{
        sx: isMobile
          ? { borderRadius: '20px 20px 0 0', m: 0 }
          : {
              borderRadius: 3,
            },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: isMobile ? 18 : 20,
          py: isMobile ? 1.5 : 2.5,
          fontWeight: 700,
        }}
      >
        {title}
      </DialogTitle>
      {content && (
        <DialogContent sx={{ pb: 2 }}>
          {typeof content === 'string' ? (
            <Typography variant="body2" sx={{ fontSize: '15px', lineHeight: 1.6 }}>
              {content}
            </Typography>
          ) : (
            content
          )}
        </DialogContent>
      )}
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
