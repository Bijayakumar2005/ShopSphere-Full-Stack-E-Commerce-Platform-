import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Save, Package, AlertTriangle,
  XCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ArrowUpDown, X
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Breadcrumbs, Button, Spinner } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { formatCurrency } from '@/utils/format'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'
import apiClient from '@/services/apiClient'
import { productService } from '@/services/productService'

const LOW_STOCK_THRESHOLD = 10

function stockStatus(qty) {
  if (qty === 0) return 'OUT_OF_STOCK'
  if (qty <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK'
  return 'IN_STOCK'
}

function StockBar({ qty }) {
  const max = 50
  const pct = Math.min((qty / max) * 100, 100)
  const color =
    qty === 0 ? 'bg-red-500' :
    qty <= LOW_STOCK_THRESHOLD ? 'bg-amber-400' :
    'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn(
        'text-sm font-bold tabular-nums w-8 text-right',
        qty === 0 ? 'text-red-600' : qty <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-slate-900'
      )}>
        {qty}
      </span>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, iconBg, borderColor, loading }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4 border-l-4', borderColor)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-12 bg-slate-100 animate-pulse rounded mt-0.5" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 leading-tight">{value ?? '–'}</p>
        )}
      </div>
    </div>
  )
}

export default function AdminInventory() {
  const [products, setProducts]         = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError]               = useState(null)
  const [search, setSearch]             = useState('')
  const [stockFilter, setStockFilter]   = useState('ALL')
  const [sortBy, setSortBy]             = useState('stockQuantity')
  const [sortDir, setSortDir]           = useState('asc')
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [pendingQty, setPendingQty]     = useState({})
  const [saving, setSaving]             = useState({})
  const PAGE_SIZE = 20
  const searchRef = useRef(null)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient.get('/admin/inventory/stats')
      setStats(res.data?.data ?? null)
    } catch (e) {
      console.warn('inventory stats failed', e)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchInventory = useCallback(async (overrides = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page:    overrides.pg      ?? page,
        size:    PAGE_SIZE,
        sortBy:  overrides.sb      ?? sortBy,
        sortDir: overrides.sd      ?? sortDir,
      }
      const kw = overrides.keyword !== undefined ? overrides.keyword : search
      if (kw && kw.trim()) params.keyword = kw.trim()
      const st = overrides.status !== undefined ? overrides.status : stockFilter
      if (st && st !== 'ALL') params.stockStatus = st
      const res = await apiClient.get('/admin/inventory', { params })
      const data = res.data?.data
      setProducts(data?.content ?? [])
      setTotalPages(data?.totalPages ?? 1)
      setTotalElements(data?.totalElements ?? 0)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir, search, stockFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchInventory()
  }, [page, sortBy, sortDir, stockFilter]) // eslint-disable-line

  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setPage(0)
      fetchInventory({ keyword: val, pg: 0 })
    }, 400)
  }

  const handleFilterChange = (val) => {
    setStockFilter(val)
    setPage(0)
  }

  const handleSort = (field) => {
    const newDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortDir(newDir)
    setPage(0)
  }

  const saveStock = async (product) => {
    const raw = pendingQty[product.id]
    if (raw === '' || raw === undefined) return
    const qty = Number(raw)
    if (!Number.isInteger(qty) || qty < 0) {
      toast.error('Enter a valid non-negative whole number')
      return
    }
    setSaving(prev => ({ ...prev, [product.id]: true }))
    try {
      const updated = await productService.updateProductStock(product.id, qty)
      const newQty = updated.stockQuantity ?? updated.stock ?? qty
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, stockQuantity: newQty } : p)
      )
      setPendingQty(prev => { const n = { ...prev }; delete n[product.id]; return n })
      toast.success(`"${product.name.slice(0, 30)}" → ${newQty} units`)
      fetchStats()
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Update failed')
    } finally {
      setSaving(prev => ({ ...prev, [product.id]: false }))
    }
  }

  const SortTh = ({ field, children }) => (
    <th
      scope="col"
      tabIndex={0}
      role="columnheader"
      aria-sort={sortBy === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => handleSort(field)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort(field)}
      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={11} className={sortBy === field ? 'text-brand-600' : 'text-slate-300'} aria-hidden="true" />
      </span>
    </th>
  )

  const filters = [
    { key: 'ALL',          label: 'All',           icon: Package,       active: 'bg-slate-800 text-white border-slate-800' },
    { key: 'IN_STOCK',     label: 'In Stock',      icon: CheckCircle2,  active: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'LOW_STOCK',    label: 'Low Stock',      icon: AlertTriangle, active: 'bg-amber-500 text-white border-amber-500' },
    { key: 'OUT_OF_STOCK', label: 'Out of Stock',  icon: XCircle,       active: 'bg-red-500 text-white border-red-500' },
  ]

  const alertCount = (stats?.outOfStock ?? 0) + (stats?.lowStock ?? 0)

  return (
    <AdminLayout
      user={{ name: 'Admin' }}
      breadcrumbs={<Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Inventory' }]} />}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and update product stock levels</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setPage(0); fetchInventory({ pg: 0 }); fetchStats() }} disabled={loading}>
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Alert banner */}
      {!statsLoading && alertCount > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Attention needed: </span>
            {stats.outOfStock > 0 && <span className="font-medium">{stats.outOfStock} out of stock</span>}
            {stats.outOfStock > 0 && stats.lowStock > 0 && ' · '}
            {stats.lowStock > 0 && <span className="font-medium">{stats.lowStock} running low (≤{LOW_STOCK_THRESHOLD} units)</span>}
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Products" value={stats?.totalProducts} icon={Package}       iconBg="bg-brand-600"   borderColor="border-l-brand-600"   loading={statsLoading} />
        <StatCard label="In Stock"       value={stats?.inStock}       icon={CheckCircle2}  iconBg="bg-emerald-600" borderColor="border-l-emerald-500" loading={statsLoading} />
        <StatCard label="Low Stock"      value={stats?.lowStock}      icon={AlertTriangle} iconBg="bg-amber-500"   borderColor="border-l-amber-400"   loading={statsLoading} />
        <StatCard label="Out of Stock"   value={stats?.outOfStock}    icon={XCircle}       iconBg="bg-red-500"     borderColor="border-l-red-500"     loading={statsLoading} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name or brand…"
            aria-label="Search by name or brand"
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
        <div role="group" aria-label="Filter inventory by stock status" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap -mx-1 px-1">
          {filters.map(({ key, label, icon: Icon, active }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              aria-pressed={stockFilter === key}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                stockFilter === key ? active : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon size={11} aria-hidden="true" />
              {label}
              {!statsLoading && key === 'LOW_STOCK' && (stats?.lowStock ?? 0) > 0 && (
                <span className={cn('px-1.5 py-0 rounded-full text-[10px] font-bold leading-4',
                  stockFilter === key ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                )}>{stats.lowStock}</span>
              )}
              {!statsLoading && key === 'OUT_OF_STOCK' && (stats?.outOfStock ?? 0) > 0 && (
                <span className={cn('px-1.5 py-0 rounded-full text-[10px] font-bold leading-4',
                  stockFilter === key ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700'
                )}>{stats.outOfStock}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Inventory
            {!loading && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {totalElements} product{totalElements !== 1 ? 's' : ''}
                {stats?.lowStockThreshold != null && (
                  <span className="ml-1 text-slate-300">· Low-stock ≤ {stats.lowStockThreshold} units</span>
                )}
              </span>
            )}
          </h2>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
            <Spinner size="md" />
            <p className="text-sm">Loading inventory…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-3 text-red-500">
            <XCircle size={36} className="opacity-60" />
            <p className="text-sm font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={() => fetchInventory()}>Retry</Button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
            <Package size={40} className="opacity-30" />
            <p className="text-sm">
              {search || stockFilter !== 'ALL' ? 'No products match your filters.' : 'No products in inventory.'}
            </p>
            {(search || stockFilter !== 'ALL') && (
              <Button size="sm" variant="outline" onClick={() => { setSearch(''); handleFilterChange('ALL') }}>Clear filters</Button>
            )}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortTh field="name">Product</SortTh>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <SortTh field="price">Price</SortTh>
                  <SortTh field="stockQuantity">Stock Level</SortTh>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Set New Qty</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const status   = stockStatus(p.stockQuantity ?? 0)
                  const pending  = pendingQty[p.id] ?? ''
                  const isDirty  = pending !== ''
                  const isSaving = !!saving[p.id]
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/60',
                        status === 'OUT_OF_STOCK' && 'bg-red-50/40',
                        status === 'LOW_STOCK'    && 'bg-amber-50/25',
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0 border',
                            status === 'OUT_OF_STOCK' ? 'bg-red-50 border-red-100'
                            : status === 'LOW_STOCK'  ? 'bg-amber-50 border-amber-100'
                            :                            'bg-slate-50 border-slate-100'
                          )}>
                            {p.emoji || '📦'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {p.categoryName || p.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800">{formatCurrency(p.price)}</span>
                      </td>
                      <td className="px-5 py-3.5 min-w-[130px]">
                        <StockBar qty={p.stockQuantity ?? 0} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusIndicator status={status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder={String(p.stockQuantity ?? 0)}
                          aria-label={`Set new stock quantity for ${p.name}`}
                          value={pending}
                          onChange={e => setPendingQty(prev => ({ ...prev, [p.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveStock(p)}
                          disabled={isSaving}
                          className={cn(
                            'w-24 h-8 px-2 rounded-md border text-sm focus:outline-none focus:ring-2 transition-colors',
                            isDirty ? 'border-brand-400 ring-brand-500 bg-brand-50' : 'border-slate-300 focus:ring-brand-500 bg-white'
                          )}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <Button
                          size="xs"
                          variant={isDirty ? 'primary' : 'outline'}
                          disabled={!isDirty || isSaving}
                          onClick={() => saveStock(p)}
                          aria-label={`Update stock quantity for ${p.name}`}
                          className="gap-1.5 whitespace-nowrap"
                        >
                          {isSaving ? <><Spinner size="sm" /> Saving…</> : <><Save size={12} /> Update</>}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-500" aria-live="polite">Page {page + 1} of {totalPages} · {totalElements} total</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
                      page === pg ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </nav>
        )}
      </div>
    </AdminLayout>
  )
}
