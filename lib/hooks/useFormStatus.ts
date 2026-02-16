import { useCallback, useMemo } from 'react';
import type { Assignment } from '@/lib/services/assignments';
import { assignmentService } from '@/lib/services/assignments';
import { toast } from '@/lib/utils/toast';

export type AssignmentFormAttentionReason = 'declined' | 'not-signed' | null;

function getFormAttentionReason(assignment: Assignment | null | undefined): AssignmentFormAttentionReason {
  if (!assignment) return null;

  // Wenn Einsatzmitteilung explizit abgelehnt wurde
  if (assignment.formStatus === 'declined') {
    return 'declined';
  }

  // Wenn eine Einsatzmitteilung existiert, aber keine Unterschrift der Einrichtung
  // oder generell kein formStatus gesetzt ist
  const hasForm = Boolean(
    assignment.formStatus ||
      assignment.formPlace ||
      assignment.formTimes ||
      assignment.formNotes ||
      assignment.formSignatureName
  );

  if (hasForm && !assignment.formSignedAt) {
    return 'not-signed';
  }

  return null;
}

export const useFormStatus = (assignment: Assignment | null | undefined) => {
  const reason = useMemo(() => getFormAttentionReason(assignment), [assignment]);
  const needsAttention = useMemo(() => reason !== null, [reason]);

  const notifyAdmins = useCallback(async () => {
    if (!assignment?.id) {
      toast.error('Kein Assignment für die Meldung gefunden.');
      return;
    }

    const effectiveReason = getFormAttentionReason(assignment);
    if (!effectiveReason) {
      toast.info('Für diese Einsatzmitteilung besteht aktuell kein Handlungsbedarf.');
      return;
    }

    try {
      await assignmentService.notifyAdminsAboutFormStatus(assignment.id, effectiveReason);
      toast.success('Meldung wurde an die Administration gesendet.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unbekannter Fehler beim Senden der Meldung.';
      toast.error(`Meldung konnte nicht gesendet werden: ${message}`);
    }
  }, [assignment]);

  return {
    needsAttention,
    reason,
    notifyAdmins,
  };
};

