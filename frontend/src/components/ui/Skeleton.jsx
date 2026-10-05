import { cn } from '@/utils/cn'

const lineVariants = {
  default: 'h-4 rounded bg-slate-200',
  heading: 'h-6 rounded bg-slate-200',
  subheading: 'h-5 rounded bg-slate-200',
  text: 'h-3 rounded bg-slate-200',
}

/**
 * SkeletonLine — single animated shimmer line.
 */
export function SkeletonLine({ width = 'w-full', variant = 'default', className }) {
  return (
    <div
      className={cn('skeleton rounded', lineVariants[variant], width, className)}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonAvatar — circular shimmer for profile images.
 */
export function SkeletonAvatar({ size = 'md', className }) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' }
  return (
    <div
      className={cn('skeleton rounded-full shrink-0', sizeMap[size], className)}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonImage — rectangular shimmer for image placeholders.
 */
export function SkeletonImage({ aspectRatio = 'aspect-square', className }) {
  return (
    <div
      className={cn('skeleton rounded-lg w-full', aspectRatio, className)}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonCard — full card skeleton.
 */
export function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-3',
        className
      )}
      aria-busy="true"
      aria-label="Loading content"
    >
      <SkeletonLine variant="heading" width="w-3/4" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-5/6" />
      <SkeletonLine width="w-2/3" />
    </div>
  )
}

/**
 * SkeletonProductCard — product card skeleton.
 */
export function SkeletonProductCard({ className }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden',
        className
      )}
      aria-busy="true"
      aria-label="Loading product"
    >
      <SkeletonImage aspectRatio="aspect-[4/3]" className="rounded-none" />
      <div className="p-4 flex flex-col gap-2.5">
        <SkeletonLine variant="text" width="w-1/3" />
        <SkeletonLine variant="heading" width="w-full" />
        <SkeletonLine variant="text" width="w-2/4" />
        <div className="flex items-center gap-2 pt-1">
          <SkeletonLine variant="subheading" width="w-1/3" />
          <SkeletonLine variant="text" width="w-1/4" />
        </div>
      </div>
    </div>
  )
}

/**
 * SkeletonTableRow — table row skeleton.
 */
export function SkeletonTableRow({ cols = 5, className }) {
  return (
    <tr className={cn('border-b border-slate-100', className)} aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine
            width={i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-1/2' : 'w-5/6'}
          />
        </td>
      ))}
    </tr>
  )
}
