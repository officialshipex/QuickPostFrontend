// Money on screen: always the exact amount with two decimals, Indian grouping ("1,23,456.50", "45.00").
// Placeholders a screen shows for "no value" ("-", "—", "N/A") come back unchanged; an empty value shows `fallback`.
export const money2 = (value: unknown, fallback = '0.00'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(typeof value === 'string' ? value.replace(/,/g, '').trim() : value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
