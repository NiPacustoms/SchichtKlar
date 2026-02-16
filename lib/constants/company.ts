const DEFAULT_COMPANY_NAME = 'AufAbruf GmbH';
const DEFAULT_COMPANY_SLUG = 'aufabruf';

export const SINGLE_COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME?.trim() || DEFAULT_COMPANY_NAME;

export const SINGLE_COMPANY_ID =
  process.env.NEXT_PUBLIC_COMPANY_SLUG?.trim() || DEFAULT_COMPANY_SLUG;

