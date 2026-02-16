'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Stack,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formatCurrency } from '@/lib/utils/format';

interface EmployerCostsCardProps {
  stats: {
    totalEmployerCost: number;
  };
  detail?: {
    totalHealthInsurance: number;
    totalPensionInsurance: number;
    totalUnemploymentInsurance: number;
    totalCareInsurance: number;
    totalAccidentInsurance: number;
    totalInsolvencyInsurance: number;
    totalContributions: number;
    totalGrossSalary: number;
    totalEmployerCost: number;
  };
  sx?: Record<string, unknown>;
}

export function EmployerCostsCard({ stats: _stats, detail, sx }: EmployerCostsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Lohnnebenkosten-Detail</Typography>
            <Typography variant="body2" color="text.secondary">
              (nur Admin)
            </Typography>
          </Stack>
        }
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      <Collapse in={expanded}>
        <CardContent>
          {detail ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Sozialversicherung (AG-Anteile)
                </Typography>
                <Stack spacing={1.5}>
                  <DetailRow
                    label="AG-Anteil Krankenversicherung"
                    value={formatCurrency(detail.totalHealthInsurance)}
                  />
                  <DetailRow
                    label="AG-Anteil Rentenversicherung"
                    value={formatCurrency(detail.totalPensionInsurance)}
                  />
                  <DetailRow
                    label="AG-Anteil Arbeitslosenversicherung"
                    value={formatCurrency(detail.totalUnemploymentInsurance)}
                  />
                  <DetailRow
                    label="AG-Anteil Pflegeversicherung"
                    value={formatCurrency(detail.totalCareInsurance)}
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Weitere AG-Kosten
                </Typography>
                <Stack spacing={1.5}>
                  <DetailRow
                    label="Unfallversicherung"
                    value={formatCurrency(detail.totalAccidentInsurance)}
                  />
                  <DetailRow
                    label="Insolvenzgeldumlage"
                    value={formatCurrency(detail.totalInsolvencyInsurance)}
                  />
                  <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid rgba(0,0,0,0.1)' }}>
                    <DetailRow
                      label="Gesamt Lohnnebenkosten"
                      value={formatCurrency(detail.totalContributions)}
                      bold
                      size="body1"
                    />
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '2px solid',
                    borderColor: 'error.main',
                    backgroundColor: 'rgba(211,47,47,0.05)',
                  }}
                >
                  <DetailRow
                    label="Gesamt AG-Kosten (Brutto + Lohnnebenkosten)"
                    value={formatCurrency(detail.totalEmployerCost)}
                    bold
                    size="h6"
                    color="error"
                  />
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Wählen Sie eine Periode aus, um die Lohnnebenkosten-Details anzuzeigen.
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  bold = false,
  size = 'body2',
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  size?: 'body2' | 'body1' | 'h6';
  color?: string;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant={size} color="text.secondary">
        {label}
      </Typography>
      <Typography variant={size} fontWeight={bold ? 700 : 400} color={color || 'text.primary'}>
        {value}
      </Typography>
    </Stack>
  );
}
