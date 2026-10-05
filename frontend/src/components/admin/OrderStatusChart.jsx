import { useState } from 'react'
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const STATUS_CONFIG = {
  PLACED: {
    label: 'Order Placed',
    color: 'bg-sky-500',
    textColor: 'text-sky-700',
    lightBg: 'bg-sky-50',
    borderColor: 'border-sky-200',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    lightBg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
  },
  SHIPPED: {
    label: 'In Transit / Shipped',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: PackageCheck,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-rose-400',
    textColor: 'text-rose-700',
    lightBg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: XCircle,
  },
}

export function OrderStatusChart({ distribution = {}, totalOrders = 0, loading = false }) {
  const [hoveredStatus, setHoveredStatus] = useState(null)

  const keys = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  const total = totalOrders || keys.reduce((sum, key) => sum + (distribution[key] || 0), 0)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded-full w-full mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Order Status Breakdown
          </h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {total} {total === 1 ? 'Order' : 'Total Orders'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Real-time delivery lifecycle status across customer fulfillment pipelines
        </p>

        {/* Multi-segment Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-inner mb-5">
          {total === 0 ? (
            <div className="w-full bg-slate-200 h-full rounded-full" />
          ) : (
            keys.map((key) => {
              const count = distribution[key] || 0
              if (count === 0) return null
              const percent = Math.max(1, Math.round((count / total) * 100))
              const config = STATUS_CONFIG[key]
              const isHovered = hoveredStatus === key

              return (
                <div
                  key={key}
                  style={{ width: `${(count / total) * 100}%` }}
                  onMouseEnter={() => setHoveredStatus(key)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={cn(
                    'h-full rounded-full transition-all duration-200 cursor-pointer relative group',
                    config.color,
                    isHovered ? 'opacity-100 ring-2 ring-offset-1 ring-slate-400 scale-y-110 z-10' : 'opacity-90 hover:opacity-100'
                  )}
                  title={`${config.label}: ${count} (${percent}%)`}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Grid of status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {keys.map((key) => {
          const count = distribution[key] || 0
          const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
          const config = STATUS_CONFIG[key]
          const isHovered = hoveredStatus === key
          const Icon = config.icon

          return (
            <div
              key={key}
              onMouseEnter={() => setHoveredStatus(key)}
              onMouseLeave={() => setHoveredStatus(null)}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-150',
                isHovered
                  ? `${config.lightBg} ${config.borderColor} shadow-xs scale-[1.02]`
                  : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/60'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                  config.lightBg,
                  config.textColor
                )}
              >
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {config.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{count}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                  <span className="capitalize">{key.toLowerCase()}</span>
                  <span>{percent}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderStatusChart
