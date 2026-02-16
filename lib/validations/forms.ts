import { z } from 'zod';

/**
 * Zod-Schemas für Forms-API-Validierung
 */

/**
 * Schema für Reminder erstellen (POST /api/forms/reminders)
 */
export const createReminderSchema = z.object({
  employeeId: z.string().min(1, 'employeeId ist erforderlich'),
  formType: z.string().min(1, 'formType ist erforderlich').trim(),
  dueDate: z.string().datetime().or(z.date()),
  message: z.string().trim().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

