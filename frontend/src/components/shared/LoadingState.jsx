import { Spinner } from '@/components/ui'
import { cn } from '@/utils/cn'

/**
 * LoadingState — full-page or inline loading indicator.
 *
 * @param {'page'|'section'|'inline'} variant
 * @param {string} message
 */
export function LoadingState({ variant = 'page', message, className }) {
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2 text-sm text-slate-500', className)}>
        <Spinner size="sm" color="slate" />
        {message && <span>{message}</span>}
      </span>
    )
  }

  if (variant === 'section') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 py-16',
          className
        )}
        role="status"
        aria-label={message ?? 'Loading'}
      >
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-slate-500">{message}</p>
        )}
      </div>
    )
  }

  // page
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4',
        className
      )}
      role="status"
      aria-label={message ?? 'Loading'}
    >
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="8" fill="#4F46E5" />
          <path
            d="M9 13h14l-1.8 9.5a1 1 0 0 1-.98.5H11.78a1 1 0 0 1-.98-.5L9 13Z"
            fill="white"
          />
          <path
            d="M13 13v-2a3 3 0 0 1 6 0v2"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-lg font-bold text-slate-900">ShopSphere</span>
      </div>
      <Spinner size="md" />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  )
}
