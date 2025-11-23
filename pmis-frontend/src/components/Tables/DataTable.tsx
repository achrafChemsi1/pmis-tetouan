import React, { useMemo } from 'react';

interface DataTableProps<T extends object> {
  columns: Array<{ key: keyof T; label: string; render?: (value: any, row: T) => React.ReactNode }>;
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onRowSelect?: (row: T) => void;
  selectableRows?: boolean;
  selectedRows?: Set<string>;
  rowKey?: keyof T;
  actions?: (row: T) => React.ReactNode;
}

function DataTable<T extends object>({
  columns,
  data,
  page,
  pageSize,
  total,
  loading = false,
  onPageChange,
  onRowSelect,
  selectableRows = false,
  selectedRows,
  rowKey = 'id',
  actions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  const handleSelectRow = (row: T) => {
    if (onRowSelect) onRowSelect(row);
  };

  const memoizedRows = useMemo(() => data.map((row) => (
    <tr
      key={String(row[rowKey])}
      className="hover:bg-gray-100 border-b last:border-b-0 focus:outline-none"
      tabIndex={0}
      aria-selected={!!selectedRows?.has(String(row[rowKey]))}
      onClick={() => handleSelectRow(row)}
    >
      {selectableRows && (
        <td className="px-2 py-2">
          <input
            type="checkbox"
            checked={!!selectedRows?.has(String(row[rowKey]))}
            aria-label="Select row"
            readOnly
          />
        </td>
      )}
      {columns.map((col) => (
        <td key={String(col.key)} className="px-4 py-2 text-sm">
          {col.render ? col.render(row[col.key], row) : row[col.key]}
        </td>
      ))}
      {actions && <td>{actions(row)}</td>}
    </tr>
  )), [data, columns, onRowSelect, selectableRows, selectedRows, rowKey, actions]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow text-left">
        <thead className="bg-gray-100">
          <tr>
            {selectableRows && <th className="px-2 py-2"></th>}
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-2 font-bold text-gray-700 text-xs uppercase"
                scope="col"
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-2 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>{loading ? (
          <tr><td colSpan={columns.length + (actions ? 1 : 0) + (selectableRows ? 1 : 0)} className="text-center p-4 text-gray-400">Loading...</td></tr>
        ) : memoizedRows}</tbody>
      </table>
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-gray-600">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange && onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
            aria-disabled={page <= 1}
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange && onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
            aria-disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DataTable) as typeof DataTable;
