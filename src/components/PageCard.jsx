import React from 'react';

export default function PageCard({ children, className = '', padding = 'md' }) {
  const padClass = padding === 'sm' ? 'p-3 md:p-4' : 'p-4 md:p-6';
  return (
    <div
      className={`rounded-[var(--card-radius)] shadow-[var(--card-shadow)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${padClass} ${className}`}
    >
      {children}
    </div>
  );
}
