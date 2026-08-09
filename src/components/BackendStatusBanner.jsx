import React from 'react';

/**
 * BackendStatusBanner — amber dismissible banner for backend wakeup or API errors.
 * Used by all list pages and dashboard widgets.
 */
export default function BackendStatusBanner({ message, onRetry = null, onDismiss = null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-700/40 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200"
    >
      <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-snug">{message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
