import { cn } from '@/utils/cn'

const statusConfig = {
  PLACED: {
    dot: 'bg-indigo-500',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    label: 'Order Placed',
  },
  PROCESSING: {
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Processing',
  },
  PENDING: {
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending',
  },
  CONFIRMED: {
    dot: 'bg-blue-400',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Confirmed',
  },
  SHIPPED: {
    dot: 'bg-purple-400',
    text: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Shipped',
  },
  DELIVERED: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Delivered',
  },
  CANCELLED: {
    dot: 'bg-red-400',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Cancelled',
  },
  // Payment statuses
  PAID: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Paid',
  },
  REFUNDED: {
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Refunded',
  },
  // Stock statuses
  IN_STOCK: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'In Stock',
  },
  LOW_STOCK: {
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Low Stock',
  },
  OUT_OF_STOCK: {
    dot: 'bg-red-400',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Out of Stock',
  },
  // User statuses
  ACTIVE: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Active',
  },
  INACTIVE: {
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Inactive',
  },
}

/**
 * StatusIndicator — a pill with a dot and label for status display.
 *
 * @param {string} status — key from statusConfig
 * @param {string} customLabel — override the default label
 * @param {'pill'|'dot-only'|'label-only'} variant
 */
export function StatusIndicator({ status, customLabel, variant = 'pill', className }) {
  const cfg = statusConfig[status] ?? {
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: status ?? 'Unknown',
  }
  const label = customLabel ?? cfg.label

  if (variant === 'dot-only') {
    return (
      <span
        className={cn('inline-block w-2 h-2 rounded-full', cfg.dot, className)}
        title={label}
      />
    )
  }

  if (variant === 'label-only') {
    return (
      <span className={cn('text-sm font-medium', cfg.text, className)}>
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {label}
    </span>
  )
}
