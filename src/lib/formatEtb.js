/**
 * formatEtb — format a number as Ethiopian Birr currency.
 * Visual only — no business logic. Used by ERP UI components.
 * @param {number} amount
 * @param {object} opts
 * @param {boolean} [opts.showSymbol=true]
 * @param {number} [opts.decimals=2]
 * @returns {string}
 */
export function formatEtb(amount, { showSymbol = true, decimals = 2 } = {}) {
  if (amount == null || isNaN(Number(amount))) return '—';
  const formatted = Number(amount).toLocaleString('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `ETB ${formatted}` : formatted;
}

export default formatEtb;
