import React from 'react';

export default function EmptyState({ title, description, action = null, icon = '📂' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[var(--card-radius)]">
      {icon && (
        <span className="text-4xl mb-3 role-presentation select-none" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
