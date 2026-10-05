import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'

/**
 * EmptyState — displayed when a list or page has no content.
 *
 * @param {ReactNode} icon — Lucide icon element
 * @param {string} title
 * @param {string} description
 * @param {string} actionLabel
 * @param {function} onAction
 * @param {'sm'|'md'|'lg'} size
 */
export function EmptyState({
  icon,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  size = 'md',
  className,
}) {
  const sizeStyles = {
    sm: { wrapper: 'py-10', iconBox: 'w-12 h-12', iconSize: 'w-5 h-5', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-16', iconBox: 'w-16 h-16', iconSize: 'w-7 h-7', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-24', iconBox: 'w-20 h-20', iconSize: 'w-9 h-9', title: 'text-lg', desc: 'text-base' },
  }
  const s = sizeStyles[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-4',
        s.wrapper,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400',
            s.iconBox
          )}
        >
          <span className={s.iconSize}>{icon}</span>
        </div>
      )}

      <div className="space-y-1.5 max-w-xs">
        <p className={cn('font-semibold text-slate-800', s.title)}>{title}</p>
        {description && (
          <p className={cn('text-slate-500 leading-relaxed', s.desc)}>
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
