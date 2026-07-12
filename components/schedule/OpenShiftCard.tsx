'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { facilityService } from '@/lib/services/facilities';
import { logger } from '@/lib/logging';
import type { Shift } from '@/lib/types';
import {
  AccessTime,
  Add,
  CheckCircle,
  LocationOn,
  People,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { Alert, Box, Button, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface OpenShiftCardProps {
  shift: Shift;
  onRequest: (message?: string) => void;
  isQualified: boolean;
  missingQualifications: string[];
  getShiftTypeColor: (type: string) => string;
  formatTime: (date: Date, time: string) => string;
  getTimeUntilShift: (shift: Shift) => string;
  isLoading?: boolean;
}

export function OpenShiftCard({
  shift,
  onRequest,
  isQualified,
  missingQualifications,
  getShiftTypeColor,
  formatTime: _formatTime,
  getTimeUntilShift,
  isLoading = false,
}: OpenShiftCardProps) {
  const [facilityDetails, setFacilityDetails] = useState<{
    name?: string;
    stationName?: string;
    address?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFacilityDetails = async () => {
      if (!shift.facilityId) {
        if (isMounted) {
          setFacilityDetails(null);
        }
        return;
      }

      try {
        const facility = await facilityService.getById(shift.facilityId);
        if (!isMounted) return;

        if (!facility) {
          setFacilityDetails(null);
          return;
        }

        const station = facility.stations?.find(stationItem => stationItem.id === shift.stationId);
        setFacilityDetails({
          name: facility.name,
          stationName: station?.name,
          address: facility.address,
        });
      } catch (error) {
        if (isMounted) {
          setFacilityDetails(null);
        }
        logger.error(
          'Failed to load facility details for shift',
          error instanceof Error ? error : new Error(String(error)),
          { shiftId: shift.id } as Record<string, unknown>
        );
      }
    };

    void loadFacilityDetails();

    return () => {
      isMounted = false;
    };
  }, [shift.facilityId, shift.stationId, shift.id]);

  const shiftDate = useMemo(() => {
    const dateValue = shift.date instanceof Date ? shift.date : new Date(shift.date);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }, [shift.date]);

  const capacity = Math.max(shift.capacity || shift.maxStaff || 1, 1);
  const assignedCount = Math.max(shift.assignedCount || 0, 0);
  const availableSlots = Math.max(capacity - assignedCount, 0);
  const occupancyPercentage = Math.min((assignedCount / capacity) * 100, 100);

  const requiredQualifications = shift.requiredQualifications || [];

  const timeUntilShift = getTimeUntilShift(shift);
  const resolvedFacilityName = facilityDetails?.name || 'Schicht';
  const resolvedStationName = facilityDetails?.stationName;

  const handleRequest = () => {
    if (!isQualified) {
      // Show warning but still allow request
      const message = `Ich bewerbe mich für diese Schicht, obwohl mir folgende Qualifikationen fehlen: ${missingQualifications.join(', ')}`;
      onRequest(message);
    } else {
      onRequest();
    }
  };

  return (
    <GlassCard>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {resolvedFacilityName}
            </Typography>
            {resolvedStationName && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {resolvedStationName}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 16, color: getShiftTypeColor(shift.type) }} />
              <Typography
                variant="body2"
                sx={{ color: getShiftTypeColor(shift.type), fontWeight: 500 }}
              >
                Schicht
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Offen"
            color="info"
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              height: 28,
            }}
          />
        </Box>

        {/* Date and Time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {shiftDate ? format(shiftDate, 'dd.MM.yyyy', { locale: de }) : 'Datum unbekannt'} •{' '}
            {shift.startTime} - {shift.endTime}
          </Typography>
        </Box>

        {/* Location */}
        {(facilityDetails?.name || facilityDetails?.address) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Box>
              {facilityDetails?.name && (
                <Typography variant="body2" color="text.secondary">
                  {facilityDetails.name}
                  {facilityDetails.stationName ? ` - ${facilityDetails.stationName}` : ''}
                </Typography>
              )}
              {facilityDetails?.address && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {facilityDetails.address}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Time Until Shift */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Schicht beginnt in:
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
            {timeUntilShift}
          </Typography>
        </Box>

        {/* Capacity Indicator */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Besetzung: {assignedCount}/{capacity} Plätze
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={occupancyPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': {
                // Semantikfarben flach (Clean & Flat: keine Verläufe)
                backgroundColor:
                  occupancyPercentage >= 80
                    ? 'success.main'
                    : occupancyPercentage >= 50
                      ? 'warning.main'
                      : 'error.main',
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {availableSlots} von {capacity} Plätzen noch frei
          </Typography>
        </Box>

        {/* Required Qualifications */}
        {requiredQualifications.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Erforderliche Qualifikationen:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {requiredQualifications.map(qual => {
                const hasQualification = !missingQualifications.includes(qual);
                return (
                  <Chip
                    key={qual}
                    label={qual}
                    size="small"
                    variant={hasQualification ? 'filled' : 'outlined'}
                    color={hasQualification ? 'success' : 'warning'}
                    icon={hasQualification ? <CheckCircle /> : <Warning />}
                    sx={{
                      fontWeight: 600,
                      fontSize: '12px',
                      height: 28,
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Qualification Warning */}
        {!isQualified && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '14px' }}>
              ⚠️ Fehlende Qualifikationen: {missingQualifications.join(', ')}
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 0.5, fontSize: '12px', lineHeight: 1.5 }}
            >
              Du kannst dich trotzdem bewerben, aber die Zuweisung ist nicht garantiert.
            </Typography>
          </Alert>
        )}

        {/* Shift Notes */}
        {shift.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Notizen:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {shift.notes}
            </Typography>
          </Box>
        )}

        {/* Request Button */}
        <Button
          variant="contained"
          color={isQualified ? 'primary' : 'warning'}
          startIcon={<Add />}
          onClick={handleRequest}
          fullWidth
          size="large"
          disabled={isLoading}
          sx={{
            mt: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {isLoading ? 'Wird gesendet...' : isQualified ? 'Schicht anfragen' : 'Trotzdem anfragen'}
        </Button>

        {/* Additional Info */}
        {!isQualified && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            Anfrage wird mit Hinweis auf fehlende Qualifikationen gesendet
          </Typography>
        )}
      </CardContent>
    </GlassCard>
  );
}
