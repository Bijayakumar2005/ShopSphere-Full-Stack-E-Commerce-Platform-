import { useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-full mx-4',
}

/**
 * Modal — accessible dialog with focus trap, ESC close, scroll lock.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} title
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full'} size
 * @param {boolean} showClose — show the X close button
 * @param {boolean} closeOnOverlay — close when clicking outside
 * @param {ReactNode} footer
 */
export function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  className,
}) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)
  const titleId = useId()

  // Save previous focus and lock scroll
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
      // Focus the modal panel after animation frame
      requestAnimationFrame(() => {
        panelRef.current?.focus()
      })
    } else {
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
      // Simple focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={ariaLabel || (!title ? 'Dialog' : undefined)}
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-modal flex flex-col',
          'animate-scale-in outline-none',
          'max-h-[92vh] sm:max-h-[90vh]',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            {title && (
              <h2
                id={titleId}
                className="text-base font-semibold text-slate-900"
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-auto rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100',
                  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                )}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-5 pt-4 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
