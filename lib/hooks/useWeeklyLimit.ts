'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readWeeklyLimit } from '@/lib/services/employees/readWeeklyLimit';
import { writeWeeklyLimit } from '@/lib/services/employees/writeWeeklyLimit';
import type { WeeklyLimit } from '@/lib/types/weeklyLimit';

const QUERY_KEY = 'weeklyLimit';

export function useWeeklyLimit(mitarbeiterId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<WeeklyLimit | null>({
    queryKey: [QUERY_KEY, mitarbeiterId],
    queryFn: () => (mitarbeiterId ? readWeeklyLimit(mitarbeiterId) : Promise.resolve(null)),
    enabled: !!mitarbeiterId,
    staleTime: 1 * 60 * 1000,
  });

  const setLimitMutation = useMutation({
    mutationFn: ({ mitarbeiterId: id, limit }: { mitarbeiterId: string; limit: number }) =>
      writeWeeklyLimit(id, limit),
    onSuccess: (_, { mitarbeiterId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, mitarbeiterId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    setLimit: setLimitMutation.mutateAsync,
    isSettingLimit: setLimitMutation.isPending,
  };
}
