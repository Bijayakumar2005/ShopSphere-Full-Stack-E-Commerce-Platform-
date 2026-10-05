import { cn } from '@/utils/cn'
import { SkeletonTableRow } from './Skeleton'

/**
 * Table — data table with sortable columns, loading skeleton, empty state.
 *
 * columns: Array<{
 *   key: string,
 *   header: string,
 *   render?: (value, row) => ReactNode,
 *   className?: string,
 *   headerClassName?: string,
 *   align?: 'left' | 'center' | 'right',
 * }>
 *
 * @param {Array<object>} data
 * @param {Array<object>} columns
 * @param {string} rowKey — key used for React key prop
 * @param {boolean} loading
 * @param {ReactNode} emptyState
 * @param {boolean} striped
 * @param {boolean} hoverable
 * @param {function} onRowClick
 */
export function Table({
  data = [],
  columns = [],
  rowKey = 'id',
  loading = false,
  emptyState,
  striped = false,
  hoverable = false,
  onRowClick,
  className,
}) {
  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

  return (
    <div className={cn('w-full overflow-x-auto -webkit-overflow-scrolling-touch rounded-xl border border-slate-200', className)}>
      <table className="w-full min-w-[600px] text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap',
                  alignClass[col.align ?? 'left'],
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                {emptyState ?? (
                  <p className="text-sm text-slate-400">No data available</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row[rowKey] ?? rowIdx}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn(
                  'transition-colors duration-100',
                  striped && rowIdx % 2 !== 0 && 'bg-slate-50/50',
                  hoverable && 'hover:bg-slate-50',
                  onRowClick && 'cursor-pointer focus-visible:bg-slate-100 focus-visible:outline-none'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-slate-700',
                      alignClass[col.align ?? 'left'],
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
