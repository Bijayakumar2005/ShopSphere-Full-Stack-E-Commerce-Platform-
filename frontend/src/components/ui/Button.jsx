import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const variantStyles = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs hover:shadow-sm border border-transparent',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-transparent',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-xs',
  ghost:
    'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs hover:shadow-sm border border-transparent',
  'danger-outline':
    'border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 shadow-xs',
  link: 'border-0 bg-transparent text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline px-0 shadow-none',
}

const sizeStyles = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1 font-medium',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5 font-medium',
  md: 'h-10 px-4 text-sm rounded-xl gap-2 font-semibold',
  lg: 'h-11 px-5 text-base rounded-xl gap-2 font-semibold',
  xl: 'h-12 px-6 text-base rounded-xl gap-2.5 font-bold',
  'icon-xs': 'h-7 w-7 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-lg',
  'icon-md': 'h-10 w-10 rounded-xl',
  'icon-lg': 'h-11 w-11 rounded-xl',
}

const spinnerSize = {
  xs: 12,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 17,
  'icon-xs': 12,
  'icon-sm': 14,
  'icon-md': 15,
  'icon-lg': 16,
}

/**
 * Button — primary interactive element.
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'danger-outline'|'link'} variant
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'icon-xs'|'icon-sm'|'icon-md'|'icon-lg'} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 cursor-pointer',
        variant !== 'link' && 'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
        'select-none whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            className="animate-spin shrink-0"
            size={spinnerSize[size] ?? 15}
          />
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  )
}
