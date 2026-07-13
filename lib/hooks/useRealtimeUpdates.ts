'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    // Prüfe, ob wir im Browser sind
    if (typeof window === 'undefined') {
      return;
    }

    // === PRODUCTION MODE (Firestore Listeners) ===
    // Mock Mode wurde entfernt - nur noch echte Firestore-Updates
    if (!user) {
      logger.debug('No user authenticated, skipping realtime updates');
      return;
    }

    // Check if Firebase is initialized
    if (!db) {
      logger.warn('Firebase Firestore not initialized, skipping realtime updates');
      return;
    }

    try {
      logger.debug('Setting up Firestore realtime listeners');
      const unsubscribers: Array<() => void> = [];

      // Listen to shifts updates (only if user has companyId)
      // WICHTIG: Shifts-Query benötigt companyId für Firestore Rules
      // Nur ausführen, wenn companyId vorhanden ist, um Permission-Denied-Fehler zu vermeiden
      if (user.companyId) {
        try {
          // Hole alle Facilities der Company, um nach facilityIds zu filtern
          // Da Firestore 'in' Query max 10 Werte unterstützt, filtern wir client-seitig
          // Mandantenisolation: companyId-Filter ist unter den strikten
          // Firestore-Rules Pflicht (sonst permission-denied auf shifts).
          const shiftsQuery = query(
            collection(db, 'shifts'),
            where('companyId', '==', user.companyId),
            where('date', '>=', new Date())
          );
          const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
            logger.debug('Realtime: Shifts updated', snapshot.size, 'documents');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['admin'] });
          }, (error) => {
            // Permission errors are expected - suppress or log as debug
            const isPermissionError = error?.code === 'permission-denied' || 
                                      error?.message?.includes('permission') ||
                                      error?.message?.includes('Permission');
            if (isPermissionError) {
              // Erwarteter Fehler - nur im Debug-Modus loggen
              if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === 'true') {
                logger.debug('Shifts listener: Permission denied (expected behavior)');
              }
            } else {
              logger.error('Error in shifts listener:', error);
            }
          });
          unsubscribers.push(unsubShifts);
        } catch (error) {
          // If query setup fails, just skip this listener
          logger.debug('Could not set up shifts listener:', error);
        }
      } else {
        logger.debug('Skipping shifts listener: No companyId available');
      }

      // Listen to timesheets (admin dashboard: offene Zeiterfassungen, KPIs)
      if (user.companyId) {
        try {
          const timesheetsQuery = query(
            collection(db, 'timesheets'),
            where('companyId', '==', user.companyId)
          );
          const unsubTimesheets = onSnapshot(timesheetsQuery, (snapshot) => {
            logger.debug('Realtime: Timesheets updated', snapshot.size, 'documents');
            queryClient.invalidateQueries({ queryKey: ['admin'] });
          }, (error) => {
            const isPermissionError = error?.code === 'permission-denied' ||
              error?.message?.includes('permission') ||
              error?.message?.includes('Permission');
            if (!isPermissionError) logger.error('Error in timesheets listener:', error);
          });
          unsubscribers.push(unsubTimesheets);
        } catch (error) {
          logger.debug('Could not set up timesheets listener:', error);
        }
      }

      // Listen to user's assignments
      // Filter nach userId und companyId (falls verfügbar) für bessere Performance und Sicherheit
      const assignmentConstraints = [where('userId', '==', user.id)];
      if (user.companyId) {
        assignmentConstraints.push(where('companyId', '==', user.companyId));
      }
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        ...assignmentConstraints
      );
      const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
        logger.debug('Realtime: Assignments updated', snapshot.size, 'documents');
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['admin'] });
      }, (error) => {
        // Permission errors are expected in some cases - suppress or log as debug
        const isPermissionError = error?.code === 'permission-denied' || 
                                  error?.message?.includes('permission') ||
                                  error?.message?.includes('Permission');
        if (isPermissionError) {
          // Erwarteter Fehler - nur im Debug-Modus loggen
          if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === 'true') {
            logger.debug('Assignments listener: Permission denied (expected in some cases)');
          }
        } else {
          logger.error('Error in assignments listener:', error);
        }
      });
      unsubscribers.push(unsubAssignments);

      // Listen to notifications
      // Filter nach userId, read und companyId (falls verfügbar) für bessere Performance und Sicherheit
      const notificationConstraints = [
        where('userId', '==', user.id),
        where('read', '==', false)
      ];
      if (user.companyId) {
        notificationConstraints.push(where('companyId', '==', user.companyId));
      }
      const notificationsQuery = query(
        collection(db, 'notifications'),
        ...notificationConstraints
      );
      const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
        logger.debug('Realtime: Notifications updated', snapshot.size, 'documents');
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, (error) => {
        // Permission errors are expected in some cases - suppress or log as debug
        const isPermissionError = error?.code === 'permission-denied' || 
                                  error?.message?.includes('permission') ||
                                  error?.message?.includes('Permission');
        if (isPermissionError) {
          // Erwarteter Fehler - nur im Debug-Modus loggen
          if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === 'true') {
            logger.debug('Notifications listener: Permission denied (expected in some cases)');
          }
        } else {
          logger.error('Error in notifications listener:', error);
        }
      });
      unsubscribers.push(unsubNotifications);

      // Cleanup all listeners
      return () => {
        logger.debug('Cleaning up Firestore listeners');
        unsubscribers.forEach((unsub, index) => {
          try {
            // Prüfe, ob die Funktion noch existiert, bevor wir sie aufrufen
            if (typeof unsub === 'function') {
              unsub();
            }
          } catch (error) {
            // Ignoriere Fehler beim Schließen von Listenern
            // Diese können auftreten, wenn die Verbindung bereits geschlossen ist
            // und sind harmlos (z.B. 400 Bad Request beim Terminieren)
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorText = errorMessage.toLowerCase();
            
            // Unterdrücke nur harmlose Verbindungsfehler
            const isHarmlessError = 
              errorText.includes('400') ||
              errorText.includes('bad request') ||
              errorText.includes('terminate') ||
              errorText.includes('webchannel') ||
              errorText.includes('connection closed') ||
              errorText.includes('already closed');
            
            if (!isHarmlessError) {
              logger.warn(`Error cleaning up listener ${index} (non-critical):`, error);
            }
          }
        });
        // Leere das Array, um sicherzustellen, dass keine Referenzen mehr existieren
        unsubscribers.length = 0;
      };
    } catch (error) {
      logger.error('Realtime connection failed:', error);
      // Don't reconnect on initialization error - just log it
      return;
    }
  }, [user, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    const cleanup = connect();
    
    return () => {
      disconnect();
      if (cleanup) cleanup();
    };
  }, [connect, disconnect]);

  return {
    isConnected: FEATURE_FLAGS.USE_REALTIME && !!user,
    reconnectAttempts: reconnectAttempts.current,
  };
}
