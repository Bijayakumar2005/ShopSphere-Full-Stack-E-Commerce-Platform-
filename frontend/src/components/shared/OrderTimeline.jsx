import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

const stepConfig = {
  ORDER_PLACED: {
    icon: ShoppingCart,
    label: 'Order Placed',
    color: 'text-brand-600',
    bg: 'bg-brand-50 border-brand-200',
    line: 'bg-brand-200',
  },
  CONFIRMED: {
    icon: CheckCircle2,
    label: 'Order Confirmed',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    line: 'bg-blue-200',
  },
  SHIPPED: {
    icon: Truck,
    label: 'Shipped',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    line: 'bg-purple-200',
  },
  DELIVERED: {
    icon: Package,
    label: 'Delivered',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    line: 'bg-emerald-200',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    line: 'bg-red-200',
  },
  PENDING: {
    icon: Clock,
    label: 'Pending',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    line: 'bg-amber-200',
  },
}

/**
 * OrderTimeline — vertical timeline of order status events.
 *
 * events: Array<{
 *   status: string,           — key from stepConfig
 *   timestamp: string,        — ISO date string
 *   description?: string,     — optional detail line
 *   active?: boolean,         — is this the current step
 *   completed?: boolean,      — is this step done
 * }>
 */
export function OrderTimeline({ events = [], className }) {
  return (
    <ol className={cn('relative flex flex-col gap-0', className)} aria-label="Order timeline">
      {events.map((event, idx) => {
        const cfg = stepConfig[event.status] ?? {
          icon: Clock,
          label: event.status,
          color: 'text-slate-500',
          bg: 'bg-slate-50 border-slate-200',
          line: 'bg-slate-200',
        }
        const Icon = cfg.icon
        const isLast = idx === events.length - 1
        const isDone = event.completed
        const isActive = event.active && !isDone

        return (
          <li key={idx} className="flex gap-4 relative">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[18px] top-9 bottom-0 w-0.5',
                  isDone ? cfg.line : 'bg-slate-200'
                )}
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10',
                isDone || isActive ? cfg.bg : 'bg-slate-50 border-slate-200',
                isActive && 'ring-2 ring-offset-2 ring-brand-300'
              )}
            >
              <Icon
                size={16}
                className={isDone || isActive ? cfg.color : 'text-slate-300'}
              />
            </div>

            {/* Content */}
            <div className={cn('pb-8 flex-1', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  isDone || isActive ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {cfg.label}
              </p>
              {event.timestamp && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(event.timestamp, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {event.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
