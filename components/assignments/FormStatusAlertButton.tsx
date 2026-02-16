import { Button, Stack, Typography } from '@mui/material';
import { ErrorOutline, WarningAmber } from '@mui/icons-material';
import type { Assignment } from '@/lib/services/assignments';
import { useFormStatus } from '@/lib/hooks/useFormStatus';

interface FormStatusAlertButtonProps {
  assignment: Assignment;
  size?: 'small' | 'medium' | 'large';
}

export function FormStatusAlertButton({ assignment, size = 'small' }: FormStatusAlertButtonProps) {
  const { needsAttention, reason, notifyAdmins } = useFormStatus(assignment);

  if (!needsAttention || !reason) {
    return null;
  }

  const isDeclined = reason === 'declined';
  const color: 'warning' | 'error' = isDeclined ? 'error' : 'warning';
  const Icon = isDeclined ? ErrorOutline : WarningAmber;
  const label = isDeclined
    ? 'Einrichtung hat Einsatz abgelehnt – Admin informieren'
    : 'Einsatz noch nicht von Einrichtung unterschrieben – Admin informieren';

  return (
    <Button
      variant="outlined"
      color={color}
      size={size}
      onClick={notifyAdmins}
      sx={{ mt: 1.5, textTransform: 'none', borderWidth: 1.5 }}
      startIcon={<Icon fontSize="small" />}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
    </Button>
  );
}
