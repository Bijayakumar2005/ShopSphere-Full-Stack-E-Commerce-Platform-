import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Plus,
  RefreshCw,
  FolderTree,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StatCard } from '@/components/admin/StatCard'
import { OrderStatusChart } from '@/components/admin/OrderStatusChart'
import { Breadcrumbs, Button, Badge } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { ErrorState } from '@/components/shared/ErrorState'
import { adminService } from '@/services/adminService'
import { formatCurrency, formatDate } from '@/utils/format'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch admin dashboard statistics'
      console.error('Failed to fetch admin dashboard data:', err)
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Safe defaults while loading
  const totalRevenue = stats?.totalRevenue ?? 0
  const totalOrders = stats?.totalOrders ?? 0
  const totalCustomers = stats?.totalCustomers ?? 0
  const totalProducts = stats?.totalProducts ?? 0
  const pendingOrders = stats?.pendingOrders ?? 0
  const deliveredOrders = stats?.deliveredOrders ?? 0
  const lowStockProducts = stats?.lowStockProducts ?? 0
  const recentOrders = stats?.recentOrders ?? []
  const lowStockList = stats?.lowStockList ?? []
  const distribution = stats?.orderStatusDistribution ?? {}

  return (
    <AdminLayout
      pageTitle="Business Overview"
      breadcrumbs={
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]} />
      }
      pendingOrdersCount={pendingOrders}
      lowStockCount={lowStockProducts}
    >
      {/* Executive Welcome & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time store performance, fulfillment metrics, and stock intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            className="text-xs flex items-center gap-1.5 bg-white"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/admin/products/add')}
            className="text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {error && !stats ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-8 my-6">
          <ErrorState
            title="Failed to Load Dashboard Statistics"
            description={error}
            onRetry={() => fetchDashboardData()}
          />
        </div>
      ) : (
        <>
          {/* ── KPI Grid: 4 Core Business Metrics ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-5">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={20} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          change={12.4}
          changeLabel="vs last month"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={Number(totalOrders).toLocaleString('en-IN')}
          icon={<ShoppingCart size={20} />}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          change={8.2}
          changeLabel="vs last month"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={Number(totalCustomers).toLocaleString('en-IN')}
          icon={<Users size={20} />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          change={5.6}
          changeLabel="registered users"
          loading={loading}
        />
        <StatCard
          title="Total Products"
          value={Number(totalProducts).toLocaleString('en-IN')}
          icon={<Package size={20} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          change={0}
          changeLabel="in active catalog"
          loading={loading}
        />
      </div>

      {/* ── Secondary Operational Metrics: 3 Pillars ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Pending Orders</p>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 rounded mt-1.5 animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {pendingOrders}
                </span>
                {pendingOrders > 0 ? (
                  <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/60">
                    Requires action
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    All clear
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Placed, Confirmed & Processing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Delivered Orders</p>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 rounded mt-1.5 animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {deliveredOrders}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Completed
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Successfully fulfilled</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Low Stock Products</p>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 rounded mt-1.5 animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {lowStockProducts}
                </span>
                {lowStockProducts > 0 ? (
                  <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">
                    Restock needed
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Healthy
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">5 or fewer items remaining</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Warehouse size={20} />
          </div>
        </div>
      </div>

      {/* ── Main Section: 2-Column Responsive Layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg): Visualization + Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Distribution Chart */}
          <OrderStatusChart
            distribution={distribution}
            totalOrders={totalOrders}
            loading={loading}
          />

          {/* Recent Orders Table Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Recent Customer Orders
                </h2>
                <p className="text-xs text-slate-500">Latest transactions requiring fulfillment</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
              >
                <span>View all orders</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No orders placed yet. New customer orders will appear here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentOrders.map((order) => {
                      const orderRef = order.orderNumber || `ORD-${order.id}`
                      const customer = order.customerName || order.user?.name || 'Customer'
                      const amount = order.totalAmount ?? order.amount ?? 0
                      const dateStr = order.createdAt || order.date

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                            {orderRef}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium truncate max-w-[140px]">
                            {customer}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {dateStr ? formatDate(dateStr) : 'Today'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {formatCurrency(amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusIndicator status={order.orderStatus || order.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/admin/orders`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 inline-flex transition-colors"
                              title="View Order"
                            >
                              <Eye size={15} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col on lg): Quick Actions + Low Stock Products */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
              Quick Operations
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Rapid shortcuts for administrative tasks
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <Button
                size="sm"
                onClick={() => navigate('/admin/products/add')}
                className="w-full justify-between group shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Package size={15} />
                  Add New Product
                </span>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/orders')}
                className="w-full justify-between group bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <ShoppingCart size={15} className="text-brand-600" />
                  Manage Customer Orders
                </span>
                <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/inventory')}
                className="w-full justify-between group bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <Warehouse size={15} className="text-amber-600" />
                  Inventory & Restock
                </span>
                <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/customers')}
                className="w-full justify-between group bg-white hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <Users size={15} className="text-purple-600" />
                  Customer Directory
                </span>
                <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>

          {/* Low-Stock Inventory Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Stock Alerts
                </h2>
                {lowStockList.length > 0 && (
                  <Badge variant="danger" size="sm">
                    {lowStockList.length} Low
                  </Badge>
                )}
              </div>
              <Link
                to="/admin/inventory"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Restock All →
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Products at risk of stock depletion (≤ 5 units)
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : lowStockList.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">Inventory Healthy</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    No items currently below the replenishment threshold.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockList.map((product) => {
                  const isOutOfStock = product.stockQuantity === 0

                  return (
                    <div
                      key={product.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            product.emoji || '📦'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {product.categoryName || product.category || 'Product'} •{' '}
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOutOfStock ? '0 in stock' : `${product.stockQuantity} left`}
                        </span>
                        <Link
                          to="/admin/inventory"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700 p-1 rounded hover:bg-brand-50 transition-colors"
                          title="Restock this item"
                        >
                          Restock
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </AdminLayout>
  )
}
