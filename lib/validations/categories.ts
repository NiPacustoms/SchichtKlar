/**
 * Zod-Schemas für Kategorie-Items (CategoryManager, StaffGroupManager)
 * Einzelne Einträge wie Berufsbezeichnung, Rolle, Gruppe, Qualifikation
 */

import { z } from 'zod';

export const categoryItemSchema = z
  .string()
  .trim()
  .min(1, 'Bitte einen Wert angeben');

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte einen Gruppennamen angeben');
