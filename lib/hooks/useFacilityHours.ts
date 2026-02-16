'use client';

import { useQuery } from '@tanstack/react-query';
import { facilityHoursService, type FacilityHoursSummary, type FacilityHoursSummaryRequest } from '@/lib/services/facilityHours';
import { AppError, ErrorCode } from '@/lib/errors';

export function useFacilityHours(request?: FacilityHoursSummaryRequest) {
  const {
    data: summaries = [],
    isLoading,
    error,
    refetch,
  } = useQuery<FacilityHoursSummary[]>({
    queryKey: ['facilityHours', request?.facilityId, request?.startDate?.toISOString(), request?.endDate?.toISOString()],
    queryFn: () => facilityHoursService.getSummary(request),
    retry: (failureCount, error) => {
      if (error instanceof AppError && error.code === ErrorCode.FIREBASE_MISSING_INDEX) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    summaries,
    isLoading,
    error,
    refetch,
  };
}

