export function formatCurrency(value: number, currency: string = 'EUR', locale = 'de-DE') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0);
}
export function formatHours(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toFixed(2)} Std`;
}
export function formatPercent(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toFixed(1)}%`;
}
export function formatDateISO(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
export function trendColor(v: number) { return v > 0 ? 'success.main' : v < 0 ? 'error.main' : 'text.secondary'; }
export function assert<T>(val: T | null | undefined, msg: string): T {
  if (val == null) throw new Error(msg);
  return val;
}


