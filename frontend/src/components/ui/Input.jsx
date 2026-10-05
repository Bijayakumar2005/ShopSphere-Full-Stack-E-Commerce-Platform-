import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Input — text field with label, icons, error, and helper text.
 *
 * @param {string} label
 * @param {string} error — error message, triggers red styling
 * @param {string} helper — helper text below the input
 * @param {ReactNode} leftIcon — icon rendered inside left edge
 * @param {ReactNode} rightIcon — icon rendered inside right edge
 * @param {boolean} required
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    required = false,
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

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          className={cn(
            'w-full rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-xs',
            'h-10 px-3.5 py-2',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500'
              : 'border-slate-200 hover:border-slate-300',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${id}-helper`} className="text-xs text-slate-500">
          {helper}
        </p>
      )}
    </div>
  )
})
