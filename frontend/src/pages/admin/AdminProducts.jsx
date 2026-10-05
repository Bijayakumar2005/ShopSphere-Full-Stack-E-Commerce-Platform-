import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Check,
  Percent,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Breadcrumbs, Button, Badge, Pagination, Input, Select } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { ConfirmDialog } from '@/components/ui'
import { productService } from '@/services/productService'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

const STOCK_FILTERS = [
  { id: 'all', label: 'All Stock' },
  { id: 'in_stock', label: 'In Stock (> 5)' },
  { id: 'low_stock', label: 'Low Stock (1-5)' },
  { id: 'out_of_stock', label: 'Out of Stock (0)' },
]

export default function AdminProducts() {
  const navigate = useNavigate()

  // State
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // Modals & In-flight actions
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Quick edit stock modal
  const [stockModalProduct, setStockModalProduct] = useState(null)
  const [newStockValue, setNewStockValue] = useState('')
  const [updatingStock, setUpdatingStock] = useState(false)

  // Quick edit price modal
  const [priceModalProduct, setPriceModalProduct] = useState(null)
  const [newPriceValue, setNewPriceValue] = useState('')
  const [newDiscountValue, setNewDiscountValue] = useState('')
  const [updatingPrice, setUpdatingPrice] = useState(false)

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await productService.getCategories()
        setCategories(cats)
      } catch {
        // fallback handled in service
      }
    }
    loadCategories()
  }, [])

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productService.getProducts({
        search,
        category: categoryFilter,
        page: currentPage,
        limit: pageSize,
      })

      let list = res.products || []

      // Client-side stock filtering
      if (stockFilter === 'in_stock') {
        list = list.filter((p) => (p.stockQuantity ?? p.stock) > 5)
      } else if (stockFilter === 'low_stock') {
        list = list.filter((p) => {
          const s = p.stockQuantity ?? p.stock
          return s > 0 && s <= 5
        })
      } else if (stockFilter === 'out_of_stock') {
        list = list.filter((p) => (p.stockQuantity ?? p.stock) === 0)
      }

      setProducts(list)
      setTotalProducts(res.total || list.length)
      setTotalPages(res.totalPages || Math.max(1, Math.ceil((res.total || list.length) / pageSize)))
    } catch (err) {
      toast.error('Failed to load products. Using available cache.')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, stockFilter, currentPage, pageSize])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productService.deleteProduct(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted successfully`)
      setDeleteTarget(null)
      loadProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  // Handle Quick Stock Update
  const submitStockUpdate = async (e) => {
    e.preventDefault()
    if (!stockModalProduct) return
    const stockVal = parseInt(newStockValue, 10)
    if (isNaN(stockVal) || stockVal < 0) {
      toast.error('Please enter a valid non-negative stock quantity')
      return
    }

    setUpdatingStock(true)
    try {
      await productService.updateProductStock(stockModalProduct.id, stockVal)
      toast.success(`Stock updated to ${stockVal} for "${stockModalProduct.name}"`)
      setStockModalProduct(null)
      loadProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update stock')
    } finally {
      setUpdatingStock(false)
    }
  }

  // Handle Quick Price Update
  const submitPriceUpdate = async (e) => {
    e.preventDefault()
    if (!priceModalProduct) return
    const priceVal = parseFloat(newPriceValue)
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Please enter a valid price greater than 0')
      return
    }

    const discVal = newDiscountValue ? parseInt(newDiscountValue, 10) : 0
    if (discVal < 0 || discVal >= 100) {
      toast.error('Discount must be between 0% and 99%')
      return
    }

    setUpdatingPrice(true)
    try {
      await productService.updateProductPrice(priceModalProduct.id, {
        price: priceVal,
        discount: discVal > 0 ? discVal : undefined,
      })
      toast.success(`Price updated to ${formatCurrency(priceVal)}`)
      setPriceModalProduct(null)
      loadProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update price')
    } finally {
      setUpdatingPrice(false)
    }
  }

  return (
    <AdminLayout
      pageTitle="Product Management"
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: 'Admin', href: '/admin' }, { label: 'Products' }]}
        />
      }
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your store inventory, pricing, categories, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadProducts}
            disabled={loading}
            className="text-xs bg-white"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/admin/products/add')}
            className="text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, brand, or SKU..."
              aria-label="Search by product name, brand, or SKU"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              aria-label="Filter by category"
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={stockFilter}
              aria-label="Filter by stock status"
              onChange={(e) => {
                setStockFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
            >
              {STOCK_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(search || categoryFilter || stockFilter !== 'all') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
            <span className="font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Keyword: "{search}"
                <button onClick={() => setSearch('')} aria-label="Clear keyword filter" className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
                  <X size={12} />
                </button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Category: {categoryFilter}
                <button onClick={() => setCategoryFilter('')} aria-label="Clear category filter" className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
                  <X size={12} />
                </button>
              </span>
            )}
            {stockFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Stock: {STOCK_FILTERS.find((f) => f.id === stockFilter)?.label}
                <button onClick={() => setStockFilter('all')} aria-label="Clear stock filter" className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch('')
                setCategoryFilter('')
                setStockFilter('all')
                setCurrentPage(1)
              }}
              className="text-brand-600 hover:text-brand-700 font-medium ml-auto"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* ── Products List / Table ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No catalog items match your search criteria. Try modifying your filters or add a new product.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/admin/products/add')}
              className="mt-4 text-xs"
            >
              <Plus size={14} /> Add Product
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile/tablet) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category & Brand</th>
                    <th className="py-3 px-4">Price & Discount</th>
                    <th className="py-3 px-4">Inventory Level</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {products.map((product) => {
                    const stock = product.stockQuantity ?? product.stock ?? 0
                    const isOutOfStock = stock === 0
                    const isLowStock = stock > 0 && stock <= 5
                    const hasDiscount = product.discount > 0 || (product.originalPrice && product.originalPrice > product.price)

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Product info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0 overflow-hidden border border-slate-200/60">
                              {product.imageUrl || product.image ? (
                                <img
                                  src={product.imageUrl || product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                product.emoji || '📦'
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <p className="font-semibold text-slate-900 line-clamp-1 text-xs sm:text-sm">
                                {product.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                ID: #{product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Brand */}
                        <td className="py-3 px-4 text-slate-600">
                          <p className="font-medium text-slate-800">{product.brand}</p>
                          <span className="inline-block mt-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {product.categoryName || product.category || 'General'}
                          </span>
                        </td>

                        {/* Price & Quick Price Edit */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">
                                {formatCurrency(product.price)}
                              </p>
                              {hasDiscount && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="line-through text-slate-400 text-[11px]">
                                    {formatCurrency(product.originalPrice || product.price * 1.2)}
                                  </span>
                                  <span className="text-emerald-600 font-semibold text-[10px]">
                                    {product.discount || calcDiscountPercent(product.originalPrice, product.price)}% off
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                 setPriceModalProduct(product)
                                 setNewPriceValue(product.price.toString())
                                 setNewDiscountValue((product.discount || 0).toString())
                              }}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                              title="Quick price update"
                              aria-label={`Quick price update for ${product.name}`}
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Stock & Quick Stock Edit */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <StatusIndicator
                              status={isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK'}
                              variant="pill"
                            />
                            <span className="font-medium text-slate-700">{stock} units</span>
                            <button
                              onClick={() => {
                                setStockModalProduct(product)
                                setNewStockValue(stock.toString())
                              }}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                              title="Quick stock update"
                              aria-label={`Quick stock update for ${product.name}`}
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 font-bold">★</span>
                            <span className="font-semibold text-slate-800">{product.rating || 4.5}</span>
                            <span className="text-slate-400 text-[11px]">({product.reviewCount || 0})</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/products/${product.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              title="View in Store"
                              aria-label={`View ${product.name} in store`}
                            >
                              <Eye size={15} />
                            </Link>

                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Edit size={15} />
                            </Link>

                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Cards View (Visible on < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((product) => {
                const stock = product.stockQuantity ?? product.stock ?? 0
                const isOutOfStock = stock === 0
                const isLowStock = stock > 0 && stock <= 5

                return (
                  <div key={product.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-slate-200">
                        {product.imageUrl || product.image ? (
                          <img
                            src={product.imageUrl || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          product.emoji || '📦'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {product.brand} · {product.categoryName || product.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Price</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Inventory</span>
                        <div className="flex items-center gap-1.5">
                          <StatusIndicator
                            status={isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK'}
                            variant="dot-only"
                          />
                          <span className="font-semibold text-slate-800">{stock} units</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Rating</span>
                        <span className="font-semibold text-slate-800">★ {product.rating || 4.5}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStockModalProduct(product)
                          setNewStockValue(stock.toString())
                        }}
                        aria-label={`Quick stock update for ${product.name}`}
                        className="text-xs h-8 px-2.5"
                      >
                        Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPriceModalProduct(product)
                          setNewPriceValue(product.price.toString())
                          setNewDiscountValue((product.discount || 0).toString())
                        }}
                        aria-label={`Quick price update for ${product.name}`}
                        className="text-xs h-8 px-2.5"
                      >
                        Price
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        aria-label={`Edit ${product.name}`}
                        className="text-xs h-8 px-2.5 text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(product)}
                        aria-label={`Delete ${product.name}`}
                        className="text-xs h-8 px-2.5 text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Pagination Footer ───────────────────────────────────── */}
        {!loading && products.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {products.length} products (Page {currentPage} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This product will be deactivated and hidden from the customer storefront.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Product'}
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Quick Stock Update Modal ──────────────────────────────── */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Quick Stock Update</h3>
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitStockUpdate} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-600 font-medium truncate mb-1">
                  {stockModalProduct.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Current Stock: {stockModalProduct.stockQuantity ?? stockModalProduct.stock} units
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Stock Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStockValue((v) => Math.max(0, parseInt(v || '0', 10) - 1).toString())}
                    className="w-8 h-8 rounded border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    className="flex-1 py-1.5 px-3 border border-slate-200 rounded text-center text-sm font-semibold focus:border-brand-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewStockValue((v) => (parseInt(v || '0', 10) + 1).toString())}
                    className="w-8 h-8 rounded border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStockModalProduct(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={updatingStock}>
                  Save Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Price Update Modal ──────────────────────────────── */}
      {priceModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Quick Price & Discount</h3>
              <button
                onClick={() => setPriceModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitPriceUpdate} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-600 font-medium truncate mb-1">
                  {priceModalProduct.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Current: {formatCurrency(priceModalProduct.price)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm font-semibold focus:border-brand-500 outline-none"
                  placeholder="e.g. 2999"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={newDiscountValue}
                  onChange={(e) => setNewDiscountValue(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none"
                  placeholder="e.g. 15 (optional)"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceModalProduct(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={updatingPrice}>
                  Save Price
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
