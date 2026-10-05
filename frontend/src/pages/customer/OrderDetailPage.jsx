import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  CreditCard,
  Package,
  Printer,
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, SkeletonLine } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { OrderTrackingStepper } from '@/components/shared/OrderTrackingStepper'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/utils/format'

function OrderDetailSkeleton() {
  return (
    <main id="main-content" tabIndex="-1" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLine variant="heading" width="w-48" />
          <SkeletonLine variant="text" width="w-32" />
        </div>
        <SkeletonLine variant="subheading" width="w-24" />
      </div>

      {/* Stepper skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <SkeletonLine variant="subheading" width="w-40" />
        <div className="h-16 bg-slate-100 rounded-xl" />
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <SkeletonLine variant="subheading" width="w-36" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonLine variant="text" width="w-3/4" />
                  <SkeletonLine variant="text" width="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <SkeletonLine variant="subheading" width="w-32" />
            <SkeletonLine variant="text" width="w-full" />
            <SkeletonLine variant="text" width="w-full" />
            <SkeletonLine variant="text" width="w-2/3" />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTracking = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await orderService.getOrderTracking(id)
      setTracking(data)
    } catch (err) {
      console.error('Failed to load order tracking:', err)
      setError(err.response?.data?.message || 'Unable to load order tracking details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTracking()
  }, [loadTracking])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <OrderDetailSkeleton />
        <Footer />
      </div>
    )
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <Package size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            {error || 'We could not locate tracking information for this order.'}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadTracking}>
              <RotateCcw size={14} className="mr-1.5" /> Try Again
            </Button>
            <Link to="/orders">
              <Button>
                <ArrowLeft size={15} className="mr-1.5" /> Back to My Orders
              </Button>
            </Link>
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
            { label: 'My Orders', href: '/orders' },
            { label: tracking.orderNumber || `Order #${tracking.id}` },
          ]}
          className="mb-5"
        />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {tracking.orderNumber}
              </h1>
              <StatusIndicator status={tracking.currentStatus} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                Placed on <strong>{formatDate(tracking.orderDate)}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                Order ID: <span className="font-mono">{tracking.orderId || tracking.id}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={14} className="mr-1.5" /> Print Invoice
            </Button>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} className="mr-1" /> All Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Status Timeline Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 mb-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck size={18} className="text-brand-600" /> Order Tracking Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time delivery progress and status milestones
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <Clock size={13} className="text-slate-500" />
              <span>
                {tracking.isDelivered
                  ? 'Delivered'
                  : tracking.isCancelled
                  ? 'Cancelled'
                  : 'Estimated: 2–4 Business Days'}
              </span>
            </div>
          </div>

          {/* Stepper with ✓, ●, ○ visual progress */}
          <OrderTrackingStepper
            timeline={tracking.timeline}
            currentStatus={tracking.currentStatus}
            isCancelled={tracking.isCancelled}
            isDelivered={tracking.isDelivered}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Products list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Package size={16} className="text-brand-600" /> Purchased Items ({tracking.items.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {tracking.items.map((item) => (
                  <div key={item.id || item.productId} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <Link to={`/products/${item.productId}`}>
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden hover:opacity-85 transition-opacity">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{item.emoji || '📦'}</span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`}>
                        <h3 className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors truncate">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.brand} · Qty: <span className="font-semibold text-slate-800">{item.quantity}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(item.price)} each</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Summary & Delivery Address */}
          <div className="space-y-5">
            {/* Order Total Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-brand-600" /> Order Summary
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(tracking.subtotal)}</span>
                </div>

                {tracking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Savings</span>
                    <span>-{formatCurrency(tracking.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span>
                    {tracking.shippingFee === 0 ? (
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    ) : (
                      <span className="font-semibold text-slate-900">{formatCurrency(tracking.shippingFee)}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-slate-900 text-base pt-3 border-t border-slate-100">
                  <span>Total Paid / Due</span>
                  <span className="text-brand-700 text-lg">{formatCurrency(tracking.totalAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-800">{tracking.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Payment Status</span>
                  <StatusIndicator status={tracking.paymentStatus} variant="pill" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-brand-600" /> Shipping Destination
              </h2>
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {tracking.shippingAddress || 'No shipping address provided.'}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
