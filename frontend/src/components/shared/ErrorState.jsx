import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/utils/cn'

/**
 * ErrorState — displayed when a request fails.
 *
 * @param {string} title
 * @param {string} description
 * @param {function} onRetry — if provided, shows a Retry button
 * @param {'network'|'generic'} type — changes the displayed icon
 * @param {'sm'|'md'|'lg'} size
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  type = 'generic',
  size = 'md',
  className,
}) {
  const Icon = type === 'network' ? WifiOff : AlertTriangle

  const sizeStyles = {
    sm: { wrapper: 'py-10', iconBox: 'w-12 h-12', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-16', iconBox: 'w-16 h-16', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-24', iconBox: 'w-20 h-20', title: 'text-lg', desc: 'text-base' },
  }
  const s = sizeStyles[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-4',
        s.wrapper,
        className
      )}
      role="alert"
    >
      <div
        className={cn(
          'rounded-2xl bg-red-50 flex items-center justify-center text-red-400',
          s.iconBox
        )}
      >
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <p className={cn('font-semibold text-slate-800', s.title)}>{title}</p>
        <p className={cn('text-slate-500 leading-relaxed', s.desc)}>{description}</p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5"
        >
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  )
}
