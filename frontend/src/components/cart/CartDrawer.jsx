import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

export function CartDrawer() {
  const {
    items,
    totalItems,
    subtotal,
    shipping,
    totalAmount,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
  } = useCart()

  const navigate = useNavigate()
  const drawerRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Prevent background body scroll & manage focus when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        const closeBtn = drawerRef.current?.querySelector('button')
        closeBtn?.focus()
      })
    } else {
      document.body.style.overflow = 'unset'
      previousFocusRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCartDrawerOpen])

  // Close drawer on ESC key & trap focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isCartDrawerOpen) return
      if (e.key === 'Escape') {
        closeCartDrawer()
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
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
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCartDrawerOpen, closeCartDrawer])

  if (!isCartDrawerOpen) return null

  const freeShippingThreshold = 999
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal)
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Your Cart</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCartDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close cart drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Truck size={14} className="text-brand-600" />
              {amountToFreeShipping > 0 ? (
                <>Add <strong className="text-slate-900">{formatCurrency(amountToFreeShipping)}</strong> for free shipping</>
              ) : (
                <span className="text-emerald-700 font-semibold">🎉 You unlocked FREE Delivery!</span>
              )}
            </span>
            <span className="text-[11px] font-bold text-slate-500">{shippingProgress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={shippingProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Free shipping eligibility progress"
            className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                amountToFreeShipping === 0 ? 'bg-emerald-500' : 'bg-brand-600'
              )}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Item list / Empty state */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Looks like you haven't added anything to your cart yet. Discover trending products now!
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  closeCartDrawer()
                  navigate('/products')
                }}
              >
                Browse Catalog
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-3.5 flex gap-3.5 first:pt-0 last:pb-0">
                {/* Thumbnail */}
                <Link
                  to={`/products/${item.productId}`}
                  onClick={closeCartDrawer}
                  className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-2xl shrink-0 overflow-hidden hover:opacity-85 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at center, ${item.accent || '#6366f1'}15 0%, ${item.accent || '#6366f1'}30 100%)`,
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{item.emoji || '📦'}</span>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {item.brand}
                      </p>
                      <Link
                        to={`/products/${item.productId}`}
                        onClick={closeCartDrawer}
                        className="text-xs font-semibold text-slate-900 hover:text-brand-600 line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.name)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between mt-2.5">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-900" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stockQuantity}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        {formatCurrency(item.subtotal || item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-white space-y-3.5 shadow-lg">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span>
                  {shipping === 0 ? (
                    <strong className="text-emerald-600">FREE</strong>
                  ) : (
                    formatCurrency(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  closeCartDrawer()
                  navigate('/cart')
                }}
                className="w-full text-xs font-bold"
              >
                View Cart Page
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  closeCartDrawer()
                  navigate('/checkout')
                }}
                className="w-full text-xs font-bold"
              >
                Checkout <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
