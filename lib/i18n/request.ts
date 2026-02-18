// Fallback implementation for missing next-intl/server – nur Deutsch
export const locales = ['de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export const getRequestConfig = () => ({
  locale: 'de',
  messages: {},
});