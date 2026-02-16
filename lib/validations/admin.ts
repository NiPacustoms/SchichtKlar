import { z } from 'zod';

/**
 * Zod-Schemas für Admin-API-Validierung
 */

/**
 * Schema für Shift-Erstellung (POST /api/admin/shifts)
 * Hinweis: Das Schema muss mit dem tatsächlichen Body-Format übereinstimmen
 */
export const createShiftSchema = z.object({
  facilityId: z.string().min(1, 'facilityId ist erforderlich'),
  date: z.string().min(1, 'date ist erforderlich'),
  startTime: z.string().min(1, 'startTime ist erforderlich'),
  endTime: z.string().min(1, 'endTime ist erforderlich'),
  type: z.string().trim().optional(),
  capacity: z.number().int().min(1).optional(),
  maxStaff: z.number().int().min(1).optional(),
  requiredQualifications: z.array(z.string()).optional(),
  status: z.string().optional(),
  notes: z.string().trim().optional(),
  timezone: z.string().optional(),
  color: z.string().optional(),
  createdBy: z.string().optional(),
  title: z.string().trim().optional(),
  stationId: z.string().optional(),
});

/**
 * Schema für Shift-Update (PUT /api/admin/shifts)
 */
export const updateShiftSchema = z.object({
  facilityId: z.string().min(1, 'facilityId ist erforderlich').optional(),
  startTime: z.string().datetime().or(z.date()).optional(),
  endTime: z.string().datetime().or(z.date()).optional(),
  role: z.string().min(1, 'Rolle ist erforderlich').trim().optional(),
  requiredStaff: z.number().int().min(1).optional(),
  assignedStaff: z.array(z.string()).optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
});

/**
 * Schema für Shift-Query (GET /api/admin/shifts)
 */
export const shiftsQuerySchema = z.object({
  facilityId: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
  role: z.string().trim().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional().default(50),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional().default(0),
});

