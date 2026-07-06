import React from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

/**
 * DataTable — unified ERP table component used across all Core 4 module list pages.
 * @param {Array<{ key, header, render?, className? }>} columns
 * @param {Array} rows
 * @param {string} rowKey  — unique key field on each row
 * @param {function} [onRowClick]
 * @param {boolean} [loading]
 * @param {string} [emptyTitle]
 * @param {string} [emptyDescription]
 * @param {string} [emptyIcon]
 */
export default function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  onRowClick = null,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = '',
  emptyIcon = '📂',
}) {
  if (loading) return <Skeleton lines={8} />;
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;

  return (
    <div className="overflow-x-auto">
      <table className="erp-table erp-table-sticky w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.headerClassName ?? ''}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className ?? ''}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
