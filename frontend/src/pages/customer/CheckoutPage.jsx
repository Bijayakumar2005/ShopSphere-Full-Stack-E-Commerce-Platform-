import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Check,
  MapPin,
  CreditCard,
  Package,
  ChevronRight,
  Truck,
  ShoppingBag,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, Input, Select, Badge } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { orderService } from '@/services/orderService'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Review', icon: Package },
  { id: 3, label: 'Payment', icon: CreditCard },
]

const STATES = [
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Gujarat',
  'Rajasthan',
  'West Bengal',
  'Uttar Pradesh',
  'Telangana',
  'Kerala',
  'Haryana',
  'Punjab',
]

function StepIndicator({ current }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center justify-center gap-0 list-none p-0 m-0">
        {STEPS.map((step, idx) => {
          const done = step.id < current
          const active = step.id === current
          return (
            <li key={step.id} className="flex items-center" aria-current={active ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-200',
                    done
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : active
                      ? 'border-brand-600 text-brand-600 bg-white shadow-sm'
                      : 'border-slate-300 text-slate-400 bg-white'
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check size={16} /> : <step.icon size={15} />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium mt-1.5',
                    active ? 'text-brand-700 font-semibold' : done ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  <span className="sr-only">Step {step.id}: </span>
                  {step.label}
                  {done && <span className="sr-only"> (completed)</span>}
                  {active && <span className="sr-only"> (current)</span>}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-16 md:w-24 h-0.5 mb-5 mx-1 transition-colors duration-200',
                    step.id < current ? 'bg-brand-600' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalItems, subtotal, discount, shipping, totalAmount, refreshCart, isLoading: cartLoading } = useCart()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Shipping form state
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
  })
  const [errors, setErrors] = useState({})

  // Stock issue validation
  const stockIssues = items.filter(
    (item) => (item.stockQuantity ?? 1) <= 0 || item.quantity > item.stockQuantity
  )
  const hasStockIssue = stockIssues.length > 0

  const validateShippingForm = () => {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!form.address.trim()) errs.address = 'Street address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.state.trim()) errs.state = 'State is required'
    if (!form.postalCode.trim()) {
      errs.postalCode = 'Postal code is required'
    } else if (!/^\d{6}$/.test(form.postalCode.trim())) {
      errs.postalCode = 'Please enter a valid 6-digit PIN code'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleContinueToReview = (e) => {
    e.preventDefault()
    if (hasStockIssue) {
      toast.error('Please resolve stock issues in your cart before continuing.')
      return
    }
    if (validateShippingForm()) {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePlaceOrder = async () => {
    if (hasStockIssue) {
      toast.error('Some items exceed available stock. Please return to cart.')
      return
    }
    if (!validateShippingForm()) {
      setStep(1)
      toast.error('Please complete all shipping address fields.')
      return
    }

    setLoading(true)
    try {
      const orderPayload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        paymentMethod: 'CASH_ON_DELIVERY',
      }

      const createdOrder = await orderService.createOrder(orderPayload)
      toast.success('Order placed successfully! 🎉')
      await refreshCart()
      navigate(`/orders/${createdOrder.id}`)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex-1 flex items-center justify-center">
          <LoadingState message="Loading checkout details…" size="lg" />
        </main>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full shadow-card">
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title="Your cart is empty"
              description="Add items to your cart before proceeding to checkout."
              actionLabel="Browse Catalog"
              onAction={() => navigate('/products')}
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' },
          ]}
          className="mb-6"
        />

        {/* Stock warning banner if any item exceeds available stock */}
        {hasStockIssue && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-bold">Stock Availability Notice</p>
              <p className="text-xs text-red-700 mt-0.5">
                The following item(s) exceed current warehouse inventory: {stockIssues.map(i => i.name).join(', ')}.
              </p>
              <Link to="/cart" className="inline-block mt-2 text-xs font-semibold text-red-800 underline hover:text-red-900">
                Return to Cart to adjust quantities →
              </Link>
            </div>
          </div>
        )}

        {/* Multi-step indicator */}
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Step Content */}
          <div className="lg:col-span-2">
            {/* ── Step 1: Shipping Information ── */}
            {step === 1 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin size={18} className="text-brand-600" /> 1. Shipping Information
                  </h2>
                  <span className="text-xs text-slate-500">Step 1 of 3</span>
                </div>

                <form onSubmit={handleContinueToReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="e.g. John Doe"
                      required
                      value={form.fullName}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, fullName: e.target.value }))
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }))
                      }}
                      error={errors.fullName}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="10-digit mobile number"
                      required
                      value={form.phone}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value }))
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }))
                      }}
                      error={errors.phone}
                    />
                  </div>

                  <Input
                    label="Street Address"
                    placeholder="Flat / House no., building, apartment, street area"
                    required
                    value={form.address}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, address: e.target.value }))
                      if (errors.address) setErrors((prev) => ({ ...prev, address: null }))
                    }}
                    error={errors.address}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      placeholder="e.g. Mumbai"
                      required
                      value={form.city}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, city: e.target.value }))
                        if (errors.city) setErrors((prev) => ({ ...prev, city: null }))
                      }}
                      error={errors.city}
                    />
                    <Select
                      label="State"
                      required
                      options={STATES.map((s) => ({ value: s, label: s }))}
                      value={form.state}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, state: e.target.value }))
                        if (errors.state) setErrors((prev) => ({ ...prev, state: null }))
                      }}
                      error={errors.state}
                    />
                    <Input
                      label="PIN Code"
                      placeholder="6-digit PIN code"
                      required
                      value={form.postalCode}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, postalCode: e.target.value }))
                        if (errors.postalCode) setErrors((prev) => ({ ...prev, postalCode: null }))
                      }}
                      error={errors.postalCode}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link to="/cart">
                      <Button variant="ghost" size="sm" type="button" className="text-slate-600">
                        <ArrowLeft size={15} className="mr-1.5" /> Back to Cart
                      </Button>
                    </Link>
                    <Button type="submit" disabled={hasStockIssue}>
                      Review Order <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 2: Order Review ── */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Package size={18} className="text-brand-600" /> 2. Review Your Order
                  </h2>
                  <span className="text-xs text-slate-500">Step 2 of 3</span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 mb-6">
                  {items.map((item) => {
                    const itemOutOfStock = (item.stockQuantity ?? 1) <= 0
                    const itemExceedsStock = item.quantity > item.stockQuantity

                    return (
                      <div key={item.id} className="py-3.5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.emoji || '📦'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                            {itemOutOfStock && <Badge variant="danger" size="sm">Out of Stock</Badge>}
                            {!itemOutOfStock && itemExceedsStock && (
                              <Badge variant="warning" size="sm">Only {item.stockQuantity} left</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.brand} · Qty: <span className="font-semibold text-slate-700">{item.quantity}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                          <p className="text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Shipping destination preview */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Delivering to
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                    >
                      Edit Address
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{form.fullName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Phone: {form.phone}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {form.address}, {form.city}, {form.state} – {form.postalCode}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" type="button" onClick={() => setStep(1)}>
                    <ArrowLeft size={15} className="mr-1.5" /> Back
                  </Button>
                  <Button type="button" disabled={hasStockIssue} onClick={() => setStep(3)}>
                    Continue to Payment <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Payment ── */}
            {step === 3 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-brand-600" /> 3. Payment Method
                  </h2>
                  <span className="text-xs text-slate-500">Step 3 of 3</span>
                </div>

                {/* Cash on delivery selector */}
                <label className="flex items-start gap-3.5 p-4 rounded-xl border-2 border-brand-500 bg-brand-50/60 cursor-pointer mb-5 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    checked
                    readOnly
                    className="mt-1 accent-brand-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pay with cash when your package is delivered right to your doorstep. No advance online payment required.
                    </p>
                  </div>
                </label>

                {/* Delivery reassurance note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex items-start gap-3">
                  <Truck size={17} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Estimated delivery within <strong>2–4 business days</strong>. Please keep exact cash of{' '}
                    <strong>{formatCurrency(totalAmount)}</strong> ready at the time of delivery.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" type="button" onClick={() => setStep(2)}>
                    <ArrowLeft size={15} className="mr-1.5" /> Back
                  </Button>
                  <Button
                    type="button"
                    loading={loading}
                    disabled={hasStockIssue || loading}
                    onClick={handlePlaceOrder}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Confirm Order — {formatCurrency(totalAmount)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sticky top-24">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Order Summary ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h3>

              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Discount Savings</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-emerald-600">FREE</span>
                    ) : (
                      <span className="font-semibold text-slate-900">{formatCurrency(shipping)}</span>
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900 text-base">
                  <span>Total Amount</span>
                  <span className="text-brand-700 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="bg-blue-50 text-blue-800 text-[11px] p-2.5 rounded-lg mb-4 text-center font-medium">
                  Add {formatCurrency(999 - subtotal)} more for <strong>FREE Delivery</strong>!
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 text-center">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  🔒 Authoritative Server-Side Price Security
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
