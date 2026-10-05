import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Textarea — multi-line input styled to match Input.
 *
 * @param {string} label
 * @param {string} error
 * @param {string} helper
 * @param {number} rows
 * @param {boolean} required
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helper,
    required = false,
    rows = 4,
    className,
    id: externalId,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const id = externalId ?? generatedId

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 select-none"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        className={cn(
          'w-full rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-xs',
          'px-3.5 py-2.5 resize-y',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300',
          className
        )}
        {...props}
      />

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${id}-helper`} className="text-xs text-slate-500">{helper}</p>
      )}
    </div>
  )
})
