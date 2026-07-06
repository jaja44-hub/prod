import React from 'react';
import PageCard from './PageCard';
import Skeleton from './Skeleton';
import BackendStatusBanner from './BackendStatusBanner';

/**
 * WidgetCard — standard dashboard widget wrapper.
 * Provides title bar, refresh button, loading skeleton, and error banner.
 */
export default function WidgetCard({ title, loading = false, error = null, onRefresh = null, children, footer = null }) {
  return (
    <PageCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            aria-label={`Refresh ${title}`}
            className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1 rounded"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        )}
      </div>
      {loading && <Skeleton lines={4} />}
      {!loading && error && (
        <BackendStatusBanner message={error} onRetry={onRefresh} />
      )}
      {!loading && !error && children}
      {!loading && !error && footer && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
          {footer}
        </div>
      )}
    </PageCard>
  );
}
