import { cn } from '@/utils/cn'

/**
 * Card — versatile surface container.
 *
 * @param {boolean} hover — enable hover shadow lift
 * @param {boolean} clickable — make the card look interactive
 * @param {'none'|'sm'|'md'|'lg'} padding
 */
export function Card({ children, hover = false, clickable = false, padding = 'md', className, ...props }) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover',
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-slate-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('pt-4 mt-4 border-t border-slate-100 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
