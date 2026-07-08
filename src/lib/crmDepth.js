export function buildCustomerPosture(partner = {}) {
  const hasEmail = Boolean(partner?.email);
  const hasPhone = Boolean(partner?.phone);
  const customerRank = Number(partner?.customer_rank || 0);
  const supplierRank = Number(partner?.supplier_rank || 0);
  const followUpNeeded = customerRank > 0 && (!hasEmail || !hasPhone);

  return {
    hasEmail,
    hasPhone,
    customerRank,
    supplierRank,
    followUpNeeded,
    status: followUpNeeded ? 'follow_up_needed' : 'stable',
  };
}
