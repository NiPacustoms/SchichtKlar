/**
 * Zod-Schemas für Staff-Gruppen (UI/API)
 * Entspricht StaffGroupData in lib/types/staffGroup.ts
 */

import { z } from 'zod';

export const staffGroupDataSchema = z.object({
  name: z.string().trim().min(1, 'Gruppenname ist erforderlich'),
  description: z.string().trim().optional(),
  color: z.string().trim().min(1, 'Farbe ist erforderlich'),
  members: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type StaffGroupFormInput = z.infer<typeof staffGroupDataSchema>;
