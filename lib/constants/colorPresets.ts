/**
 * Gemeinsame Farbvorauswahl (20 Farben) für:
 * - Schichten (Dienste)
 * - Mitarbeitergruppen
 * - Einrichtungen
 *
 * Keine Pipette/Farbwähler – nur Vorauswahl für einheitliches Erscheinungsbild.
 */

export interface ColorPreset {
  value: string;
  label: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { value: '#1976d2', label: 'Blau' },
  { value: '#2196f3', label: 'Hellblau' },
  { value: '#03a9f4', label: 'Cyan' },
  { value: '#0097a7', label: 'Dunkelcyan' },
  { value: '#00796b', label: 'Türkis' },
  { value: '#00897b', label: 'Teal' },
  { value: '#388e3c', label: 'Grün' },
  { value: '#4caf50', label: 'Hellgrün' },
  { value: '#8bc34a', label: 'Lime' },
  { value: '#ffa000', label: 'Amber' },
  { value: '#f57c00', label: 'Orange' },
  { value: '#e64a19', label: 'Dunkelorange' },
  { value: '#d32f2f', label: 'Rot' },
  { value: '#e91e63', label: 'Pink' },
  { value: '#7b1fa2', label: 'Lila' },
  { value: '#512da8', label: 'Dunkellila' },
  { value: '#303f9f', label: 'Indigo' },
  { value: '#5d4037', label: 'Braun' },
  { value: '#795548', label: 'Beige' },
  { value: '#455a64', label: 'Grau' },
];

/** Standardfarbe (erste der Liste), z. B. für neue Schichten/Gruppen/Einrichtungen */
export const DEFAULT_PRESET_COLOR = COLOR_PRESETS[0].value;
