import { Check, Clock, Package, Truck, AlertCircle, ShoppingCart, CheckCircle2, Box } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

const stepIcons = {
  PLACED: ShoppingCart,
  CONFIRMED: CheckCircle2,
  PROCESSING: Box,
  SHIPPED: Truck,
  DELIVERED: Package,
  CANCELLED: AlertCircle,
}

/**
 * OrderTrackingStepper — Responsive order progress timeline supporting:
 * ✓ Order Placed
 * ✓ Order Confirmed
 * ✓ Processing
 * ● Shipped
 * ○ Delivered
 */
export function OrderTrackingStepper({
  timeline = [],
  currentStatus = 'PLACED',
  isCancelled = false,
  isDelivered = false,
  className,
}) {
  if (isCancelled) {
    return (
      <div className={cn('bg-red-50 border border-red-200 rounded-2xl p-6 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-red-900">This order has been cancelled</h3>
        <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
          The items in this order were restored to inventory. If you were charged or have questions, please reach out to customer support.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* ── Desktop & Tablet Horizontal Stepper (hidden on small mobile) ── */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {timeline.map((step, idx) => {
            const isCompleted = step.state === 'COMPLETED'
            const isCurrent = step.state === 'CURRENT'
            const isUpcoming = step.state === 'UPCOMING'
            const isLast = idx === timeline.length - 1
            const Icon = stepIcons[step.status] || Package

            return (
              <div key={step.status} className="flex-1 relative flex flex-col items-center">
                {/* Connecting horizontal line to next step */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute top-5 left-1/2 right-[-50%] h-1 -translate-y-1/2 z-0 transition-colors duration-300',
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                  />
                )}

                {/* Step Node Circle */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                        : isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md animate-pulse'
                        : 'bg-white text-slate-300 border-2 border-slate-200'
                    )}
                  >
                    {isCompleted ? (
                      <Check size={18} strokeWidth={2.6} />
                    ) : isCurrent ? (
                      <span className="text-base font-black leading-none">●</span>
                    ) : (
                      <span className="text-sm font-light leading-none">○</span>
                    )}
                  </div>

                  {/* Title & Status Indicator */}
                  <div className="mt-3 text-center px-1">
                    <p
                      className={cn(
                        'text-xs tracking-tight transition-colors',
                        isCompleted
                          ? 'text-slate-900 font-bold'
                          : isCurrent
                          ? 'text-brand-700 font-extrabold'
                          : 'text-slate-400 font-medium'
                      )}
                    >
                      {step.title}
                    </p>

                    {isCurrent && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                        In Progress
                      </span>
                    )}

                    {step.timestamp && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {formatDate(step.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Mobile Vertical Timeline (displayed on small mobile screens) ── */}
      <div className="block md:hidden">
        <div className="relative pl-6 space-y-6">
          {timeline.map((step, idx) => {
            const isCompleted = step.state === 'COMPLETED'
            const isCurrent = step.state === 'CURRENT'
            const isUpcoming = step.state === 'UPCOMING'
            const isLast = idx === timeline.length - 1
            const Icon = stepIcons[step.status] || Package

            return (
              <div key={step.status} className="relative flex items-start gap-4">
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-[13px] top-7 bottom-[-24px] w-0.5 transition-colors',
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                  />
                )}

                {/* Circle marker */}
                <div
                  className={cn(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all',
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                      : 'bg-white text-slate-300 border-2 border-slate-200'
                  )}
                >
                  {isCompleted ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <span className="text-xs font-bold leading-none">●</span>
                  ) : (
                    <span className="text-xs leading-none">○</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        'text-sm',
                        isCompleted
                          ? 'text-slate-900 font-bold'
                          : isCurrent
                          ? 'text-brand-700 font-extrabold'
                          : 'text-slate-400 font-medium'
                      )}
                    >
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {step.description}
                  </p>

                  {step.timestamp && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDate(step.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
