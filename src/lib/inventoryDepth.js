export function buildInventoryInsights(productLike = {}, quantLike = {}) {
  const qtyAvailable = Number(productLike?.qty_available ?? productLike?.quantity ?? 0);
  const reserved = Number(quantLike?.reserved_quantity ?? productLike?.reserved_quantity ?? 0);
  const threshold = Number(productLike?.reorder_threshold ?? 5);
  const onHand = Number(quantLike?.quantity ?? qtyAvailable ?? 0);

  const availableAfterReserve = Math.max(0, onHand - reserved);
  const reorderRequired = availableAfterReserve <= threshold;
  const transferSuggested = reserved > 0 && availableAfterReserve < onHand;

  let status = 'healthy';
  if (availableAfterReserve <= 0 || qtyAvailable <= threshold) {
    status = 'critical';
  } else if (qtyAvailable <= threshold * 2) {
    status = 'warning';
  }

  return {
    qtyAvailable,
    reserved,
    threshold,
    availableAfterReserve,
    reorderRequired,
    transferSuggested,
    status,
  };
}
