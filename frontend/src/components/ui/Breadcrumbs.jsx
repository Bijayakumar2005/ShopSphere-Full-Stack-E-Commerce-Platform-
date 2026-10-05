import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * Breadcrumbs — navigation trail.
 *
 * items: Array<{ label: string, href?: string }>
 * The last item is rendered as the current page (no link).
 */
export function Breadcrumbs({ items = [], className }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx === 0 && (
                <Home
                  size={13}
                  className="text-slate-400 shrink-0 -mt-0.5"
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  className="text-slate-700 font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.href ?? '/'}
                    className="text-slate-400 hover:text-slate-700 transition-colors duration-150 truncate max-w-[150px]"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight size={13} className="text-slate-300 shrink-0" aria-hidden="true" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
