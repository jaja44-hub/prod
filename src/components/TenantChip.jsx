import React from 'react';
import { useAuth } from '../context/AuthContext';

const TIER_LABELS = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

const TIER_STYLES = {
  starter: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  growth: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  enterprise: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

/**
 * TenantChip — displays tenant ID and plan tier badge in the header.
 */
export default function TenantChip() {
  const { userProfile } = useAuth();
  const tenantId = userProfile?.tenantId;
  const tier = userProfile?.planTier || userProfile?.plan;
  if (!tenantId) return null;

  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.starter;
  const tierLabel = TIER_LABELS[tier] ?? (tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : null);

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[7rem]">
        {tenantId}
      </span>
      {tierLabel && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${tierStyle}`}>
          {tierLabel}
        </span>
      )}
    </div>
  );
}
