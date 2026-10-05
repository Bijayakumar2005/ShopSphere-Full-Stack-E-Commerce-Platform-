import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ChevronRight, Search, RotateCcw } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, SkeletonLine } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_TABS = ['All', 'PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <div className="flex gap-6">
              <div className="space-y-1">
                <SkeletonLine variant="text" width="w-20" />
                <SkeletonLine variant="subheading" width="w-28" />
              </div>
              <div className="space-y-1">
                <SkeletonLine variant="text" width="w-16" />
                <SkeletonLine variant="text" width="w-24" />
              </div>
            </div>
            <SkeletonLine variant="text" width="w-20" />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonLine variant="text" width="w-1/2" />
                <SkeletonLine variant="text" width="w-1/4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await orderService.getOrders(0, 50)
      setOrders(res.content || [])
    } catch (err) {
      console.error('Failed to load user orders:', err)
      setError(err.response?.data?.message || 'Unable to retrieve your orders at this time.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const filtered = orders.filter((o) => {
    const matchStatus = activeTab === 'All' || o.orderStatus === activeTab
    const q = search.toLowerCase().trim()
    const matchSearch =
      !q ||
      String(o.id).includes(q) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.items && o.items.some((i) => i.name && i.name.toLowerCase().includes(q)))
    return matchStatus && matchSearch
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Orders' }]} className="mb-5" />
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, order number or product…"
            aria-label="Search by order ID, order number or product"
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status tabs */}
        <div role="tablist" aria-label="Filter orders by status" className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                activeTab === tab
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab === 'All' ? 'All Orders' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Orders list / Loading / Error / Empty States */}
        {loading ? (
          <OrdersSkeleton />
        ) : error ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-card">
            <ErrorState
              title="Failed to load orders"
              description={error}
              actionLabel="Try Again"
              onAction={loadOrders}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={<Package size={28} />}
              title="No orders placed yet"
              description="Looks like you haven't placed any orders yet. Discover high-quality products and place your first order today!"
              actionLabel="Start Shopping"
              onAction={() => navigate('/products')}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={<Search size={28} />}
              title="No orders found"
              description="No orders match your selected search or status filter criteria."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('')
                setActiveTab('All')
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
                {/* Order header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Order Number</p>
                      <p className="text-sm font-bold text-slate-900 font-mono">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Date Placed</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Total</p>
                      <p className="text-sm font-bold text-brand-700">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto">
                    <StatusIndicator status={order.orderStatus} />
                  </div>
                </div>

                {/* Order items list */}
                <div className="px-5 py-4 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id || item.productId} className="flex items-center gap-3.5 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{item.emoji || '📦'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.brand} · Qty: <span className="font-medium text-slate-700">{item.quantity}</span>
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer details & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Payment:</span>
                    <StatusIndicator status={order.paymentStatus} variant="pill" />
                    <span className="text-xs text-slate-500">({order.paymentMethod})</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link to={`/orders/${order.id}`} className="w-full sm:w-auto">
                      <Button size="sm" fullWidth className="sm:w-auto">
                        View Details <ChevronRight size={14} className="ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
