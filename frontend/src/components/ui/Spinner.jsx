import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const sizeStyles = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const colorStyles = {
  brand: 'text-brand-600',
  white: 'text-white',
  slate: 'text-slate-400',
  current: 'text-current',
}

/**
 * Spinner — animated loading indicator.
 *
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {'brand'|'white'|'slate'|'current'} color
 */
export function Spinner({ size = 'md', color = 'brand', className }) {
  return (
    <Loader2
      className={cn('animate-spin shrink-0', sizeStyles[size], colorStyles[color], className)}
      aria-label="Loading"
    />
  )
}
