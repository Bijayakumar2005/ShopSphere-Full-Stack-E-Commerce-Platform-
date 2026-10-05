import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Dropdown — floating menu attached to a trigger element.
 *
 * @param {ReactNode} trigger — the button/element that opens the dropdown
 * @param {Array<{label, icon, onClick, divider, disabled, danger}>} items
 * @param {'left'|'right'} align — alignment relative to trigger
 * @param {'bottom'|'top'} side — side to open toward
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'left',
  side = 'bottom',
  className,
  children,
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    let top, left
    if (side === 'bottom') {
      top = rect.bottom + scrollY + 6
    } else {
      top = rect.top + scrollY - 6
    }

    if (align === 'right') {
      left = rect.right + scrollX
    } else {
      left = rect.left + scrollX
    }

    setPosition({ top, left })
  }, [align, side])

  useEffect(() => {
    if (!open) return
    updatePosition()

    const handleClickOutside = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => e.key === 'Escape' && setOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: position.top,
        ...(align === 'right'
          ? { right: window.innerWidth - position.left }
          : { left: position.left }),
      }}
      className={cn(
        'z-50 min-w-[160px] bg-white rounded-lg border border-slate-200 shadow-dropdown',
        'animate-fade-in-up py-1',
        side === 'top' && '-translate-y-full -mt-3',
        className
      )}
      role="menu"
      aria-orientation="vertical"
    >
      {children
        ? children
        : items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="my-1 border-t border-slate-100" role="separator" />
            }
            return (
              <button
                key={idx}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.()
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                  'transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:bg-slate-50',
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50',
                  item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                {item.icon && (
                  <span className="shrink-0 text-slate-400 w-4 h-4 flex items-center justify-center" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            )
          })}
    </div>
  )

  return (
    <div className="relative inline-flex">
      <div
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          } else if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="inline-flex"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open && createPortal(menu, document.body)}
    </div>
  )
}
