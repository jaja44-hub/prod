import React from 'react';

const STATE_MAP = {
  draft: 'neutral',
  sent: 'info',
  sale: 'success',
  purchase: 'success',
  done: 'success',
  cancel: 'danger',
  cancelled: 'danger',
  confirmed: 'success',
  in_progress: 'info',
  to_approve: 'warning',
  waiting: 'warning',
};

function mapOdooState(state) {
  if (!state) return 'neutral';
  return STATE_MAP[state.toLowerCase()] ?? 'neutral';
}

export function StateBadge({ state, label }) {
  const variant = mapOdooState(state);
  return (
    <span className={`erp-state-badge erp-state-${variant}`}>
      {label || state || '—'}
    </span>
  );
}

export default StateBadge;
