/**
 * Layout-Konstanten gemäß Design-System (Content-Ziel 1200px, Container max 1440px).
 * Verwendung: einheitliche maxWidth für Seiten-Container.
 */
export const PAGE_MAX_WIDTH_STANDARD = 1200;
export const PAGE_MAX_WIDTH_WIDE = 1400;
export const PAGE_MAX_WIDTH_NARROW = 800;
export const PAGE_MAX_WIDTH_FORM = 720;

export type PageMaxWidthPreset = 'standard' | 'wide' | 'narrow' | 'form';

export const PAGE_MAX_WIDTH_MAP: Record<PageMaxWidthPreset, number> = {
  standard: PAGE_MAX_WIDTH_STANDARD,
  wide: PAGE_MAX_WIDTH_WIDE,
  narrow: PAGE_MAX_WIDTH_NARROW,
  form: PAGE_MAX_WIDTH_FORM,
};
