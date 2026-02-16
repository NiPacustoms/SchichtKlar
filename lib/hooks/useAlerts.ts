import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { alertService } from '@/lib/services/alerts';
import { Alert } from '@/lib/types/alert';

export const useAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realTimeAlerts, setRealTimeAlerts] = useState<Alert[]>([]);

  // Get alerts for current user
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => alertService.getAlerts(user?.id),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Real-time alerts subscription
  useEffect(() => {
    if (!user || !user.companyId) return;

    const unsubscribe = alertService.subscribeToAlerts(user.id, (newAlerts) => {
      setRealTimeAlerts(newAlerts);
    }, user.companyId);

    return unsubscribe;
  }, [user]);

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => alertService.acknowledge(alertId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => alertService.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Get unacknowledged alerts count
  const unacknowledgedCount = realTimeAlerts.filter(alert => !alert.acknowledged).length;

  // Get alerts by severity
  const criticalAlerts = realTimeAlerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);
  const highAlerts = realTimeAlerts.filter(alert => alert.severity === 'high' && !alert.acknowledged);
  const mediumAlerts = realTimeAlerts.filter(alert => alert.severity === 'medium' && !alert.acknowledged);
  const lowAlerts = realTimeAlerts.filter(alert => alert.severity === 'low' && !alert.acknowledged);

  return {
    alerts: realTimeAlerts,
    allAlerts: alerts,
    isLoading,
    unacknowledgedCount,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    acknowledge: acknowledgeMutation.mutate,
    delete: deleteMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook for admin alerts (all alerts)
export const useAdminAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realTimeAlerts, setRealTimeAlerts] = useState<Alert[]>([]);

  // Get all alerts for admin - nur für die eigene Firma
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['adminAlerts', user?.companyId],
    queryFn: () => alertService.getAlerts(undefined, 50, user?.companyId),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
    staleTime: 30 * 1000, // 30 seconds
  });

  // Real-time alerts subscription for admin
  useEffect(() => {
    if (!user?.companyId) return;
    
    const unsubscribe = alertService.subscribeToAlerts(null, (newAlerts) => {
      setRealTimeAlerts(newAlerts);
    }, user.companyId);

    return unsubscribe;
  }, [user]);

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => alertService.acknowledge(alertId, 'admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
    },
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => alertService.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
    },
  });

  // Get unacknowledged alerts count
  const unacknowledgedCount = realTimeAlerts.filter(alert => !alert.acknowledged).length;

  // Get alerts by severity
  const criticalAlerts = realTimeAlerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);
  const highAlerts = realTimeAlerts.filter(alert => alert.severity === 'high' && !alert.acknowledged);
  const mediumAlerts = realTimeAlerts.filter(alert => alert.severity === 'medium' && !alert.acknowledged);
  const lowAlerts = realTimeAlerts.filter(alert => alert.severity === 'low' && !alert.acknowledged);

  return {
    alerts: realTimeAlerts,
    allAlerts: alerts,
    isLoading,
    unacknowledgedCount,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    acknowledge: acknowledgeMutation.mutate,
    delete: deleteMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
