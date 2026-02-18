'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAssignmentsForUser,
  getAssignmentById,
  type AssignmentWithDetails,
} from '@/src/composition';

/**
 * Holt Einsätze für den aktuellen User über den Application Layer (Composition).
 * Nutzt listAssignmentsForUser-Use-Case; für Mutationen weiterhin assignmentService/cloudFunctions.
 */
export function useDomainAssignments(options?: { companyId?: string; limit?: number }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const companyId = options?.companyId;

  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AssignmentWithDetails[]>({
    queryKey: ['domain-assignments', userId, companyId, options?.limit],
    queryFn: async () =>
      (await listAssignmentsForUser.execute({
        userId,
        companyId,
        limit: options?.limit ?? 50,
      })) as AssignmentWithDetails[],
    enabled: !!userId,
    staleTime: 30_000,
  });

  return { assignments, isLoading, error, refetch };
}

/**
 * Holt ein einzelnes Assignment per ID über den Application Layer.
 */
export function useDomainAssignment(assignmentId: string | null) {
  const {
    data: assignment,
    isLoading,
    error,
    refetch,
  } = useQuery<AssignmentWithDetails | null>({
    queryKey: ['domain-assignment', assignmentId],
    queryFn: async () =>
      (assignmentId ? await getAssignmentById.execute(assignmentId) : null) as AssignmentWithDetails | null,
    enabled: !!assignmentId,
    staleTime: 30_000,
  });

  return { assignment: assignment ?? null, isLoading, error, refetch };
}
