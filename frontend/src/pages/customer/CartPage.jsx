import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, Badge, ConfirmDialog, SkeletonLine } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/utils/format'
import { toast } from 'react-hot-toast'

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
            <div className="w-20 h-20 rounded-lg bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2.5">
              <SkeletonLine variant="text" width="w-24" />
              <SkeletonLine variant="heading" width="w-3/4" />
              <div className="flex justify-between items-center pt-2">
                <SkeletonLine variant="text" width="w-20" />
                <SkeletonLine variant="subheading" width="w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <SkeletonLine variant="subheading" width="w-1/2" />
          <SkeletonLine variant="text" width="w-full" />
          <SkeletonLine variant="text" width="w-full" />
          <SkeletonLine variant="text" width="w-3/4" />
          <div className="h-11 bg-slate-200 rounded-lg mt-4" />
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    totalItems,
    subtotal,
    shipping,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading,
  } = useCart()

  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Coupon discount computation (client-side promo applied on subtotal)
  const couponDiscount = couponApplied ? Math.round(subtotal * 0.1) : 0
  const finalTotal = Math.max(0, subtotal - couponDiscount + (items.length > 0 ? shipping : 0))

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAVE10') {
      setCouponApplied(true)
      toast.success('Coupon applied! 10% off your order')
    } else {
      toast.error('Invalid or expired coupon code')
    }
  }

  // Check for any out of stock items
  const hasOutOfStock = items.some((item) => (item.stockQuantity ?? 1) <= 0)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 pb-24 lg:pb-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} className="mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Shopping Cart
            {totalItems > 0 && (
              <span className="ml-2 text-lg font-normal text-slate-400">
                ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={13} />
              Clear Cart
            </button>
          )}
        </div>

        {isLoading && items.length === 0 ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet. Start shopping!"
              actionLabel="Browse Products"
              onAction={() => navigate('/products')}
              size="lg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {items.map((item) => {
                const itemTotal = item.subtotal || item.price * item.quantity
                const isOutOfStock = (item.stockQuantity ?? 1) <= 0
                const atStockLimit = item.quantity >= item.stockQuantity

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border ${
                      isOutOfStock ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                    } shadow-card p-4 flex gap-4 transition-all`}
                  >
                    {/* Image / Thumbnail */}
                    <Link to={`/products/${item.productId}`} aria-label={`View ${item.name}`}>
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-2xl sm:text-3xl shrink-0 overflow-hidden hover:opacity-85 transition-opacity"
                        style={{
                          background: `radial-gradient(circle at center, ${item.accent || '#6366f1'}15 0%, ${item.accent || '#6366f1'}30 100%)`,
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{item.emoji || '📦'}</span>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                              {item.brand}
                            </p>
                            {isOutOfStock && (
                              <Badge variant="danger" size="sm" className="font-bold">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          <Link to={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-slate-900 hover:text-brand-700 transition-colors line-clamp-2 leading-snug mt-0.5">
                              {item.name}
                            </h3>
                          </Link>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.name)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          aria-label={`Remove ${item.name} from cart`}
                          title={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Stock warnings */}
                      {!isOutOfStock && item.stockQuantity <= 5 && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          Only {item.stockQuantity} left in stock!
                        </p>
                      )}
                      {!isOutOfStock && atStockLimit && item.stockQuantity > 5 && (
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Maximum available quantity reached ({item.stockQuantity})
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isLoading}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isOutOfStock || atStockLimit || isLoading}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-base font-bold text-slate-900">
                            {formatCurrency(itemTotal)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-slate-400">
                              {formatCurrency(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Continue shopping */}
              <Link
                to="/products"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mt-2 w-fit"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Order summary */}
            <div className="flex flex-col gap-4">
              {/* Out of stock warning banner */}
              {hasOutOfStock && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 text-xs">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Item(s) Out of Stock</p>
                    <p className="mt-0.5 text-red-600">
                      Please remove out-of-stock items before proceeding to checkout.
                    </p>
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Tag size={15} className="text-brand-600" /> Apply Coupon
                </h3>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Enter code (SAVE10)"
                    aria-label="Coupon code"
                    disabled={couponApplied}
                    className="flex-1 h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <Button
                    size="sm"
                    variant={couponApplied ? 'secondary' : 'outline'}
                    onClick={
                      couponApplied
                        ? () => {
                            setCouponApplied(false)
                            setCoupon('')
                          }
                        : applyCoupon
                    }
                    disabled={!coupon && !couponApplied}
                  >
                    {couponApplied ? 'Remove' : 'Apply'}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    ✓ SAVE10 applied — 10% off!
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Summary</h3>

                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Coupon Discount</span>
                      <span className="font-medium">-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Truck size={13} /> Shipping
                    </span>
                    {shipping === 0 ? (
                      <span className="text-emerald-600 font-medium">FREE</span>
                    ) : (
                      <span className="font-medium text-slate-900">{formatCurrency(shipping)}</span>
                    )}
                  </div>
                  {shipping > 0 && subtotal < 999 && (
                    <p className="text-xs text-slate-400">
                      Add {formatCurrency(999 - subtotal)} more for free shipping
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-base text-slate-900 pt-3 border-t border-slate-100">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-5 font-bold"
                  disabled={hasOutOfStock || isLoading}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                  <ArrowRight size={17} />
                </Button>

                <p className="text-xs text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                  🔒 Secure checkout — all payment info is encrypted
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart()
          setShowClearConfirm(false)
          toast.success('Shopping cart cleared')
        }}
        title="Clear Shopping Cart?"
        description="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmLabel="Clear All Items"
        variant="danger"
      />

      {/* Mobile Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Total ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </p>
            <p className="text-base font-black text-slate-900 leading-tight">
              {formatCurrency(finalTotal)}
            </p>
          </div>
          <Button
            size="md"
            disabled={hasOutOfStock || isLoading}
            onClick={() => navigate('/checkout')}
            className="font-bold gap-1.5 px-5"
          >
            Checkout <ArrowRight size={15} />
          </Button>
        </div>
      )}

      <Footer />
    </div>
  )
}
