import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Generate page number array with ellipsis.
 */
function getPageNumbers(currentPage, totalPages, siblingCount = 1) {
  const totalPageNumbers = siblingCount * 2 + 5

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1)
    return [...leftRange, '...', totalPages]
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => totalPages - (3 + 2 * siblingCount) + 1 + i
    )
    return [1, '...', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  )
  return [1, '...', ...middleRange, '...', totalPages]
}

const pageButtonBase = cn(
  'inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium',
  'transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
)

/**
 * Pagination — accessible page navigation.
 *
 * @param {number} currentPage — 1-based
 * @param {number} totalPages
 * @param {function} onPageChange — (page: number) => void
 * @param {number} siblingCount — pages to show on each side of current
 * @param {boolean} showInfo — show "Page X of Y" label
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showInfo = false,
  className,
}) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages, siblingCount)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          pageButtonBase,
          'text-slate-600 hover:bg-slate-100',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* Pages */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`dots-${idx}`}
            className="inline-flex items-center justify-center w-9 h-9 text-slate-400"
            aria-hidden="true"
          >
            <MoreHorizontal size={16} />
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              pageButtonBase,
              page === currentPage
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          pageButtonBase,
          'text-slate-600 hover:bg-slate-100',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'
        )}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>

      {showInfo && (
        <span className="ml-3 text-sm text-slate-500 whitespace-nowrap" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
      )}
    </nav>
  )
}
