import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Eye, CheckCircle2, Clock, Truck,
  AlertCircle, XCircle, ShoppingBag, ArrowRight, X, ChevronLeft, ChevronRight,
  User, Mail, Phone, MapPin, CreditCard, Calendar, Box, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Breadcrumbs, Button, Badge, Spinner, Modal, ConfirmDialog } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { OrderTrackingStepper } from '@/components/shared/OrderTrackingStepper'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

const STATUS_TABS = [
  { key: 'All', label: 'All Orders' },
  { key: 'PLACED', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

// State transition map: defines allowed next steps
const TRANSITIONS = {
  PLACED: {
    next: 'CONFIRMED',
    nextLabel: 'Confirm Order',
    nextIcon: CheckCircle2,
    nextVariant: 'primary',
    canCancel: true,
  },
  CONFIRMED: {
    next: 'PROCESSING',
    nextLabel: 'Start Processing',
    nextIcon: Box,
    nextVariant: 'primary',
    canCancel: true,
  },
  PROCESSING: {
    next: 'SHIPPED',
    nextLabel: 'Mark as Shipped',
    nextIcon: Truck,
    nextVariant: 'primary',
    canCancel: true,
  },
  SHIPPED: {
    next: 'DELIVERED',
    nextLabel: 'Mark Delivered',
    nextIcon: CheckCircle2,
    nextVariant: 'success',
    canCancel: true,
  },
  DELIVERED: {
    terminal: true,
    message: 'Order successfully delivered & completed.',
  },
  CANCELLED: {
    terminal: true,
    message: 'Order was cancelled. Items restored to stock.',
  },
}

function buildTimeline(order) {
  if (!order) return []
  const statuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const titles = ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped', 'Delivered']
  const descriptions = [
    'Order received and logged.',
    'Merchant confirmed order details.',
    'Items inspected and packed.',
    'Package in transit with logistics.',
    'Delivered to customer address.',
  ]
  const currentIdx = statuses.indexOf(order.orderStatus)
  return statuses.map((status, i) => ({
    status,
    title: titles[i],
    description: descriptions[i],
    timestamp: i <= currentIdx ? order.createdAt : null,
    state: order.orderStatus === 'DELIVERED'
      ? 'COMPLETED'
      : i < currentIdx
      ? 'COMPLETED'
      : i === currentIdx
      ? 'CURRENT'
      : 'UPCOMING',
  }))
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const PAGE_SIZE = 10

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Transition & Cancel states
  const [updatingId, setUpdatingId] = useState(null)
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const searchDebounceRef = useRef(null)

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await orderService.getAdminOrderStats()
      setStats(res)
    } catch (err) {
      console.warn('Failed to fetch order stats', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // ── Fetch orders ──
  const fetchOrders = useCallback(async (overrides = {}) => {
    setLoading(true)
    setError(null)
    try {
      const kw = overrides.keyword !== undefined ? overrides.keyword : search
      const st = overrides.status !== undefined ? overrides.status : statusFilter
      const pg = overrides.pg !== undefined ? overrides.pg : page
      const sb = overrides.sb !== undefined ? overrides.sb : sortBy
      const sd = overrides.sd !== undefined ? overrides.sd : sortDir

      const data = await orderService.getAdminOrders({
        keyword: kw,
        status: st,
        page: pg,
        size: PAGE_SIZE,
        sortBy: sb,
        sortDir: sd,
      })

      setOrders(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, sortBy, sortDir])

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Fetch orders on mount and whenever page, sort, or status filter changes
  useEffect(() => {
    fetchOrders()
  }, [page, sortBy, sortDir, statusFilter]) // eslint-disable-line

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setPage(0)
      fetchOrders({ keyword: val, pg: 0 })
    }, 400)
  }

  // Filter change
  const handleFilterChange = (tab) => {
    setStatusFilter(tab)
    setPage(0)
  }

  // Refresh
  const handleRefresh = () => {
    fetchOrders()
    fetchStats()
  }

  // ── Status transition action ──
  const handleTransition = async (order, targetStatus) => {
    setUpdatingId(order.id)
    try {
      const updated = await orderService.updateOrderStatus(order.id, targetStatus)
      setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)))
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(updated)
      }
      toast.success(`Order ${order.orderNumber} transitioned to ${targetStatus}`)
      fetchStats()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update order status'
      toast.error(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Confirm cancellation ──
  const handleConfirmCancel = async () => {
    if (!confirmCancelOrder) return
    setCancelling(true)
    try {
      const updated = await orderService.updateOrderStatus(confirmCancelOrder.id, 'CANCELLED')
      setOrders(prev => prev.map(o => (o.id === confirmCancelOrder.id ? updated : o)))
      if (selectedOrder && selectedOrder.id === confirmCancelOrder.id) {
        setSelectedOrder(updated)
      }
      toast.success(`Order ${confirmCancelOrder.orderNumber} cancelled. Stock restored.`)
      setConfirmCancelOrder(null)
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  // ── Open details modal ──
  const openDetails = (order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  return (
    <AdminLayout
      user={{ name: 'Admin' }}
      breadcrumbs={<Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Orders' }]} />}
    >
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Order Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track customer purchases, fulfill shipments, and transition order lifecycle
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* ── Metric / KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-l-4 border-l-brand-600 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Orders</p>
            {statsLoading ? (
              <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 leading-tight">{stats?.total ?? '–'}</p>
            )}
          </div>
        </div>

        {/* Pending & Confirmed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-l-4 border-l-blue-500 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Placed & Confirmed</p>
            {statsLoading ? (
              <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 leading-tight">
                {(stats?.placed ?? 0) + (stats?.confirmed ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Processing & Shipped */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-l-4 border-l-purple-500 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Processing & Transit</p>
            {statsLoading ? (
              <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 leading-tight">
                {(stats?.processing ?? 0) + (stats?.shipped ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-l-4 border-l-emerald-500 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Delivered</p>
            {statsLoading ? (
              <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 leading-tight">{stats?.delivered ?? 0}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by order ID, customer name, email, or address…"
            aria-label="Search by order ID, customer name, email, or address"
            className="w-full h-9 pl-8 pr-8 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              aria-label="Clear search input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div role="tablist" aria-label="Filter orders by status" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap -mx-1 px-1">
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.key
            const count =
              tab.key === 'All'
                ? stats?.total
                : stats?.[tab.key.toLowerCase()]

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleFilterChange(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isActive
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {tab.label}
                {!statsLoading && count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Orders Table Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Orders
            {!loading && (
              <span className="text-slate-400 font-normal text-xs ml-2">
                ({totalElements} order{totalElements !== 1 ? 's' : ''} found)
              </span>
            )}
          </h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Spinner size="lg" />
            <p className="text-sm font-medium">Loading orders...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center py-20 gap-3 text-red-500">
            <XCircle size={36} className="opacity-60" />
            <p className="text-sm font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={handleRefresh}>Retry</Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
            <ShoppingBag size={40} className="opacity-30" />
            <p className="text-sm">
              {search || statusFilter !== 'All'
                ? 'No orders match your search or filter criteria.'
                : 'No orders recorded in the system yet.'}
            </p>
            {(search || statusFilter !== 'All') && (
              <Button size="sm" variant="outline" onClick={() => { setSearch(''); handleFilterChange('All') }}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && orders.length > 0 && (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Transition</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const transition = TRANSITIONS[order.orderStatus]
                  const isUpdating = updatingId === order.id

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => openDetails(order)}
                          className="font-mono text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          aria-label={`View order ${order.orderNumber}`}
                        >
                          {order.orderNumber}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">
                            {order.customerName || 'Customer'}
                          </p>
                          <p className="text-xs text-slate-500">{order.customerEmail}</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {order.totalItems}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StatusIndicator status={order.paymentStatus} />
                          {order.paymentMethod && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {order.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusIndicator status={order.orderStatus} />
                      </td>

                      {/* Quick Transition Action */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {transition?.next ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="xs"
                              variant={transition.nextVariant}
                              onClick={() => handleTransition(order, transition.next)}
                              disabled={isUpdating}
                              aria-label={`${transition.nextLabel} for order ${order.orderNumber}`}
                              className="gap-1 text-[11px] font-semibold"
                            >
                              {isUpdating ? (
                                <Spinner size="sm" className="text-white" />
                              ) : (
                                <transition.nextIcon size={12} />
                              )}
                              {transition.nextLabel}
                            </Button>

                            {transition.canCancel && (
                              <button
                                onClick={() => setConfirmCancelOrder(order)}
                                disabled={isUpdating}
                                title="Cancel Order"
                                aria-label={`Cancel order ${order.orderNumber}`}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ) : order.orderStatus === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <XCircle size={12} /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* View Details button */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openDetails(order)}
                          aria-label={`View details for order ${order.orderNumber}`}
                          className="text-slate-500 hover:text-brand-600"
                        >
                          <Eye size={13} className="mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-500" aria-live="polite">
              Page {page + 1} of {totalPages} · {totalElements} total orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pg = i
                if (totalPages > 7) {
                  if (page < 4) pg = i
                  else if (page > totalPages - 5) pg = totalPages - 7 + i
                  else pg = page - 3 + i
                }
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    aria-label={`Page ${pg + 1}`}
                    aria-current={page === pg ? 'page' : undefined}
                    className={cn(
                      'w-7 h-7 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      page === pg
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {pg + 1}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Order ${selectedOrder.orderNumber}`}
          size="2xl"
        >
          <div className="space-y-6 pt-1">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <StatusIndicator status={selectedOrder.orderStatus} />
                <StatusIndicator status={selectedOrder.paymentStatus} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={13} />
                <span>Placed on {formatDate(selectedOrder.createdAt)}</span>
              </div>
            </div>

            {/* Stepper Progression */}
            <div className="py-2 px-1">
              <OrderTrackingStepper
                timeline={buildTimeline(selectedOrder)}
                currentStatus={selectedOrder.orderStatus}
                isCancelled={selectedOrder.orderStatus === 'CANCELLED'}
                isDelivered={selectedOrder.orderStatus === 'DELIVERED'}
              />
            </div>

            {/* 2-Column Info: Customer Info & Status Action Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer & Shipping Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-brand-700">
                  <User size={14} /> Customer Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <User size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">{selectedOrder.customerName || 'Customer'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{selectedOrder.customerEmail}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedOrder.shippingAddress || 'No shipping address provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <CreditCard size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600">
                      Payment: <span className="font-medium text-slate-900">{selectedOrder.paymentMethod}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Transition Control Box */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-slate-700 mb-2">
                    <ShieldCheck size={14} /> Status Actions
                  </h4>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Transition this order to its next stage. Each progression updates the customer timeline immediately.
                  </p>

                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-xs mb-3">
                    <span className="text-slate-500">Current Phase: </span>
                    <span className="font-bold text-slate-900 ml-1">{selectedOrder.orderStatus}</span>
                  </div>
                </div>

                {/* Transition Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  {TRANSITIONS[selectedOrder.orderStatus]?.next && (
                    <Button
                      variant={TRANSITIONS[selectedOrder.orderStatus].nextVariant}
                      size="sm"
                      onClick={() => handleTransition(selectedOrder, TRANSITIONS[selectedOrder.orderStatus].next)}
                      loading={updatingId === selectedOrder.id}
                      className="w-full gap-2 justify-center font-semibold"
                    >
                      <ArrowRight size={14} />
                      Advance to {TRANSITIONS[selectedOrder.orderStatus].next}
                    </Button>
                  )}

                  {TRANSITIONS[selectedOrder.orderStatus]?.canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmCancelOrder(selectedOrder)}
                      disabled={updatingId === selectedOrder.id}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2 justify-center"
                    >
                      <X size={14} />
                      Cancel Order & Restore Stock
                    </Button>
                  )}

                  {TRANSITIONS[selectedOrder.orderStatus]?.terminal && (
                    <p className="text-xs font-medium text-slate-600 text-center py-1">
                      {TRANSITIONS[selectedOrder.orderStatus].message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Box size={14} className="text-brand-600" /> Purchased Items ({selectedOrder.totalItems})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-slate-500 font-semibold uppercase">Product</th>
                      <th className="px-4 py-2.5 text-right text-slate-500 font-semibold uppercase">Price</th>
                      <th className="px-4 py-2.5 text-center text-slate-500 font-semibold uppercase">Qty</th>
                      <th className="px-4 py-2.5 text-right text-slate-500 font-semibold uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0 border border-slate-200/60">
                              {item.emoji || '📦'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                              {item.brand && <p className="text-[11px] text-slate-400">{item.brand}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-900">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span className="font-medium text-slate-900">
                  {selectedOrder.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-base text-brand-600">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Cancel Order Confirmation Dialog ── */}
      {confirmCancelOrder && (
        <ConfirmDialog
          isOpen={!!confirmCancelOrder}
          onClose={() => setConfirmCancelOrder(null)}
          onConfirm={handleConfirmCancel}
          loading={cancelling}
          title={`Cancel Order ${confirmCancelOrder.orderNumber}?`}
          description="Are you sure you want to cancel this order? This action transitions the order status to CANCELLED and immediately restores all purchased product quantities back into active inventory."
          variant="danger"
          confirmLabel="Yes, Cancel Order"
          cancelLabel="Keep Order"
        />
      )}
    </AdminLayout>
  )
}
