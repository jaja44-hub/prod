import React from 'react';

export default function PageHeader({ title, subtitle, actions = null, breadcrumbs = null }) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && <span>/</span>}
              {crumb.to ? (
                <a href={crumb.to} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{crumb.label}</a>
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
