import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * StatCard — admin dashboard key metric card.
 *
 * @param {string} title
 * @param {string|number} value — the main metric value (already formatted)
 * @param {ReactNode} icon — Lucide icon element
 * @param {string} iconBg — Tailwind bg class for icon container
 * @param {string} iconColor — Tailwind text class for the icon
 * @param {number} change — percentage change (e.g., 12.5 = +12.5%, -5.2 = -5.2%)
 * @param {string} changeLabel — e.g., "vs last month"
 * @param {boolean} loading
 */
export function StatCard({
  title,
  value,
  icon,
  iconBg = 'bg-brand-50',
  iconColor = 'text-brand-600',
  change,
  changeLabel = 'vs last month',
  loading = false,
  className,
}) {
  const isPositive = change > 0
  const isNeutral = change === 0 || change === undefined || change === null
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card p-5',
        'flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-3/4 skeleton rounded-lg" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
              {value}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              iconBg
            )}
          >
            <span className={cn('w-5 h-5 flex items-center justify-center', iconColor)}>
              {icon}
            </span>
          </div>
        )}
      </div>

      {/* Change indicator */}
      {!loading && change !== undefined && change !== null && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
              isNeutral
                ? 'bg-slate-100 text-slate-500'
                : isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
            )}
          >
            <TrendIcon size={11} />
            {isPositive && '+'}
            {Math.abs(change).toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-slate-400">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
