import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  X,
  ChevronDown,
  Grid3X3,
  List,
  Filter,
  Star,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/product/ProductCard'
import { Breadcrumbs, Button, Badge, Pagination, SkeletonProductCard } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { CATEGORIES, BRANDS } from '@/data/mockData'
import { productService } from '@/services/productService'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

// ─────────────────────────────────────────────────────────
// CONSTANTS & OPTIONS
// ─────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
]

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 – ₹10,000', min: 2000, max: 10000 },
  { label: '₹10,000 – ₹25,000', min: 10000, max: 25000 },
  { label: 'Above ₹25,000', min: 25000, max: Infinity },
]

const RATING_OPTIONS = [
  { value: 0, label: 'All Ratings' },
  { value: 4.5, label: '4.5★ & above' },
  { value: 4.0, label: '4.0★ & above' },
  { value: 3.5, label: '3.5★ & above' },
]

const ITEMS_PER_PAGE = 8

// ─────────────────────────────────────────────────────────
// FILTER PANEL COMPONENT (Shared by desktop sidebar & mobile drawer)
// ─────────────────────────────────────────────────────────
function FilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
  onCloseMobile,
  isMobile = false,
}) {
  const [minInput, setMinInput] = useState(
    filters.minPrice > 0 ? filters.minPrice.toString() : ''
  )
  const [maxInput, setMaxInput] = useState(
    filters.maxPrice < Infinity ? filters.maxPrice.toString() : ''
  )

  // Synchronize input fields with current filter state
  useEffect(() => {
    setMinInput(filters.minPrice > 0 ? filters.minPrice.toString() : '')
    setMaxInput(filters.maxPrice < Infinity ? filters.maxPrice.toString() : '')
  }, [filters.minPrice, filters.maxPrice])

  const applyCustomPrice = () => {
    const min = minInput ? Math.max(0, Number(minInput)) : 0
    const max = maxInput ? Math.max(min, Number(maxInput)) : Infinity
    onFilterChange({ minPrice: min, maxPrice: max, pricePresetIdx: -1 })
  }

  return (
    <div className={cn('flex flex-col gap-6', isMobile && 'p-6')}>
      {/* Mobile Drawer Header */}
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">Filters</h3>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* 1. Category Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Category
        </h4>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ category: '' })}
            className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
              !filters.category
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <span>All Categories</span>
            {!filters.category && <Check size={14} className="text-brand-600" />}
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected =
              filters.category.toLowerCase() === cat.name.toLowerCase() ||
              filters.category.toLowerCase() === cat.slug.toLowerCase()

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({ category: isSelected ? '' : cat.name })
                }
                className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
                  isSelected
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="text-xs text-slate-400 ml-2 shrink-0">
                  {cat.productCount}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 2. Price Range */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Price Range
        </h4>
        {/* Presets */}
        <div className="flex flex-col gap-1.5 mb-3">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected = filters.pricePresetIdx === idx
            return (
              <label
                key={preset.label}
                className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-900 group"
              >
                <input
                  type="radio"
                  name="pricePreset"
                  checked={isSelected}
                  onChange={() =>
                    onFilterChange({
                      minPrice: preset.min,
                      maxPrice: preset.max,
                      pricePresetIdx: idx,
                    })
                  }
                  className="accent-brand-600 w-4 h-4 cursor-pointer"
                />
                <span className={cn(isSelected && 'font-semibold text-slate-900')}>
                  {preset.label}
                </span>
              </label>
            )
          })}
        </div>

        {/* Custom Min/Max Inputs */}
        <div className="pt-2">
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            Custom Price (₹)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              aria-label="Minimum price"
              min="0"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomPrice()}
              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <span className="text-slate-400 text-xs" aria-hidden="true">–</span>
            <input
              type="number"
              placeholder="Max"
              aria-label="Maximum price"
              min="0"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomPrice()}
              className="w-full h-8 px-2.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <Button
              size="xs"
              variant="outline"
              onClick={applyCustomPrice}
              aria-label="Apply custom price range"
              className="shrink-0 h-8 px-2"
            >
              Go
            </Button>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. Rating Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Customer Rating
        </h4>
        <div className="flex flex-col gap-1.5">
          {RATING_OPTIONS.map((opt) => {
            const isSelected = filters.rating === opt.value
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-900"
              >
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={isSelected}
                  onChange={() => onFilterChange({ rating: opt.value })}
                  className="accent-brand-600 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  {opt.value > 0 ? (
                    <>
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className={cn(isSelected && 'font-semibold text-slate-900')}>
                        {opt.label}
                      </span>
                    </>
                  ) : (
                    <span className={cn(isSelected && 'font-semibold text-slate-900')}>
                      {opt.label}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 4. Brand Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Brand
        </h4>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {BRANDS.map((brand) => {
            const isChecked = filters.brands.includes(brand.name)
            return (
              <label
                key={brand.id}
                className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 hover:text-slate-900 group"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? filters.brands.filter((b) => b !== brand.name)
                      : [...filters.brands, brand.name]
                    onFilterChange({ brands: next })
                  }}
                  className="accent-brand-600 w-4 h-4 rounded cursor-pointer"
                />
                <span className={cn('truncate', isChecked && 'font-semibold text-slate-900')}>
                  {brand.name}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 5. Availability (In Stock Only) */}
      <div>
        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors">
          <span className="text-xs font-semibold text-slate-800">
            In Stock Only
          </span>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              onFilterChange({ inStockOnly: e.target.checked })
            }
            className="accent-brand-600 w-4 h-4 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Mobile Drawer Bottom Actions */}
      {isMobile && (
        <div className="pt-4 border-t border-slate-200 mt-auto flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              onResetFilters()
              onCloseMobile()
            }}
          >
            Reset
          </Button>
          <Button fullWidth onClick={onCloseMobile}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// LIST VIEW PRODUCT ITEM (For List mode toggle)
// ─────────────────────────────────────────────────────────
function ProductListItem({ product, isWishlisted, onWishlist, onAddToCart }) {
  const { id, name, brand, emoji, accent, price, originalPrice, rating, reviewCount, stockQuantity } = product
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const inStock = stockQuantity > 0
  const discount = calcDiscountPercent(originalPrice, price)

  const handleItemAdd = async () => {
    if (!inStock || isAdding) return
    setIsAdding(true)
    try {
      if (onAddToCart) {
        await onAddToCart(product)
      }
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
    } catch {
      // Toast handled by CartContext
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col sm:flex-row gap-5 items-center">
      {/* Image / Fallback */}
      <Link
        to={`/products/${id}`}
        className="w-full sm:w-44 aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center text-5xl shrink-0 overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}25)` }}
      >
        <span role="img" aria-label={name}>
          {emoji || '📦'}
        </span>
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="danger">Out of Stock</Badge>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between w-full h-full py-1">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {brand}
            </span>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                inStock ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}
            >
              {inStock ? `${stockQuantity} in stock` : 'Out of stock'}
            </span>
          </div>
          <Link to={`/products/${id}`}>
            <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors mt-1 line-clamp-1">
              {name}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 mt-2">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-slate-800">{rating}</span>
            <span className="text-xs text-slate-400">({reviewCount} reviews)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed hidden sm:block">
            {product.description}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{formatCurrency(price)}</span>
            {originalPrice && originalPrice > price && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <Badge variant="danger" size="sm">
                  Save {discount}%
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWishlist(product)}
              aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
              aria-pressed={isWishlisted}
              className={cn(isWishlisted && 'text-red-500 border-red-200 bg-red-50')}
            >
              <Star size={14} className={cn(isWishlisted && 'fill-red-500')} aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              disabled={!inStock || isAdding}
              loading={isAdding}
              onClick={handleItemAdd}
              aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
            >
              {justAdded ? 'Added!' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN PRODUCTS PAGE COMPONENT
// ─────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. URL-driven Filter States
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const [sort, setSort] = useState(searchParams.get('sort') ?? 'featured')
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page') ?? 1)
  )

  const [filters, setFilters] = useState(() => {
    const minP = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0
    const maxP = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : Infinity
    const cat = searchParams.get('category') ?? ''
    const brandsParam = searchParams.get('brands')
    const ratingParam = searchParams.get('rating') ? Number(searchParams.get('rating')) : 0
    const inStockParam = searchParams.get('inStock') === 'true'

    // Determine preset match
    const presetIdx = PRICE_PRESETS.findIndex(
      (p) => p.min === minP && p.max === maxP
    )

    return {
      category: cat,
      brands: brandsParam ? brandsParam.split(',') : [],
      minPrice: minP,
      maxPrice: maxP,
      pricePresetIdx: presetIdx !== -1 ? presetIdx : (minP === 0 && maxP === Infinity ? 0 : -1),
      rating: ratingParam,
      inStockOnly: inStockParam,
    }
  })

  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Mobile drawer ESC and scroll lock
  useEffect(() => {
    if (!mobileDrawerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileDrawerOpen])

  // 3. Async Data Fetching states
  const [productsData, setProductsData] = useState({
    products: [],
    total: 0,
    page: 1,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const lastPushedParamsRef = useRef(searchParams.toString())

  // Synchronize state with URL search parameters
  const updateUrlParams = useCallback((newSearch, newSort, newFilters, newPage) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newSort && newSort !== 'featured') params.set('sort', newSort)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.brands.length > 0) params.set('brands', newFilters.brands.join(','))
    if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice < Infinity) params.set('maxPrice', newFilters.maxPrice.toString())
    if (newFilters.rating > 0) params.set('rating', newFilters.rating.toString())
    if (newFilters.inStockOnly) params.set('inStock', 'true')
    if (newPage > 1) params.set('page', newPage.toString())

    const newParamStr = params.toString()
    if (searchParams.toString() !== newParamStr) {
      lastPushedParamsRef.current = newParamStr
      setSearchParams(params, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Data fetch runner
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await productService.getProducts({
        search: debouncedSearch,
        category: filters.category,
        brands: filters.brands,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        inStockOnly: filters.inStockOnly,
        sort,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })
      setProductsData(res)
    } catch (err) {
      setError(err.message || 'An error occurred while loading products.')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, filters, sort, currentPage])

  // Synchronize internal state ONLY if searchParams change externally (e.g. navigation / back / forward)
  useEffect(() => {
    const currentParamStr = searchParams.toString()
    if (currentParamStr === lastPushedParamsRef.current) {
      return
    }
    lastPushedParamsRef.current = currentParamStr

    const urlCategory = searchParams.get('category') ?? ''
    const urlSearch = searchParams.get('search') ?? searchParams.get('keyword') ?? ''
    const urlSort = searchParams.get('sort') ?? 'featured'
    const urlBrands = searchParams.get('brands') ? searchParams.get('brands').split(',') : []
    const urlMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0
    const urlMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : Infinity
    const urlRating = searchParams.get('rating') ? Number(searchParams.get('rating')) : 0
    const urlInStock = searchParams.get('inStock') === 'true'
    const urlPage = Number(searchParams.get('page') ?? 1)

    setSearch((prev) => (prev !== urlSearch ? urlSearch : prev))
    setDebouncedSearch((prev) => (prev !== urlSearch ? urlSearch : prev))
    setSort((prev) => (prev !== urlSort ? urlSort : prev))
    setCurrentPage((prev) => (prev !== urlPage ? urlPage : prev))
    setFilters((prev) => {
      const presetIdx = PRICE_PRESETS.findIndex(
        (p) => p.min === urlMinPrice && p.max === urlMaxPrice
      )
      if (
        prev.category === urlCategory &&
        prev.minPrice === urlMinPrice &&
        prev.maxPrice === urlMaxPrice &&
        prev.rating === urlRating &&
        prev.inStockOnly === urlInStock &&
        prev.brands.join(',') === urlBrands.join(',')
      ) {
        return prev
      }
      return {
        category: urlCategory,
        brands: urlBrands,
        minPrice: urlMinPrice,
        maxPrice: urlMaxPrice,
        pricePresetIdx: presetIdx !== -1 ? presetIdx : (urlMinPrice === 0 && urlMaxPrice === Infinity ? 0 : -1),
        rating: urlRating,
        inStockOnly: urlInStock,
      }
    })
  }, [searchParams])

  // Fetch when filters, search, sort, or page change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Keep URL searchParams synchronized when internal filters change
  useEffect(() => {
    updateUrlParams(debouncedSearch, sort, filters, currentPage)
  }, [debouncedSearch, sort, filters, currentPage, updateUrlParams])

  // Filter modifier helper
  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }))
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setSort('featured')
    setFilters({
      category: '',
      brands: [],
      minPrice: 0,
      maxPrice: Infinity,
      pricePresetIdx: 0,
      rating: 0,
      inStockOnly: false,
    })
    setCurrentPage(1)
  }

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search) count++
    if (filters.category) count++
    if (filters.brands.length > 0) count += filters.brands.length
    if (filters.minPrice > 0 || filters.maxPrice < Infinity) count++
    if (filters.rating > 0) count++
    if (filters.inStockOnly) count++
    return count
  }, [search, filters])

  // Handlers for wishlist and cart
  const handleWishlist = async (product) => {
    await toggleWishlist(product)
  }

  const handleAddToCart = async (product) => {
    await addToCart(product, 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 outline-none">
        {/* ── Breadcrumbs ───────────────────────────────── */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(filters.category ? [{ label: filters.category }] : []),
          ]}
          className="mb-5"
        />

        {/* ── Mobile Search Bar ─────────────────────────── */}
        <div className="relative mb-4 lg:hidden">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search products, brands, categories…"
            aria-label="Search products, brands, categories"
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setDebouncedSearch('')
                setCurrentPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex gap-8 items-start">
          {/* ── Desktop Filter Sidebar (Sticky) ─────────── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <Badge variant="primary" size="sm">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <RotateCcw size={11} />
                    Reset
                  </button>
                )}
              </div>

              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
              />
            </div>
          </aside>

          {/* ── Main Catalog Column ──────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mobile filter button & Desktop Search */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden shrink-0 gap-1.5 h-10 px-3.5"
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <Filter size={15} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="primary" size="sm">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Desktop Search Input */}
                <div className="hidden lg:flex relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search products, brands…"
                    aria-label="Search products, brands"
                    className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      aria-label="Clear search"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Product count, Sort dropdown, View mode */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Product Count indicator */}
                <span className="text-xs sm:text-sm text-slate-500 hidden sm:inline whitespace-nowrap" aria-live="polite">
                  {isLoading ? (
                    'Loading products…'
                  ) : (
                    <>
                      Showing{' '}
                      <strong className="text-slate-800">
                        {productsData.total > 0
                          ? `${(productsData.page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                              productsData.page * ITEMS_PER_PAGE,
                              productsData.total
                            )}`
                          : 0}
                      </strong>{' '}
                      of <strong className="text-slate-800">{productsData.total}</strong>
                    </>
                  )}
                </span>

                {/* Sort Dropdown */}
                <div className="relative flex items-center">
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
                    aria-label="Sort products by"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Sort: {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>

                {/* View Mode Toggle (Grid / List) */}
                <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80" role="group" aria-label="View layout mode">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-400 hover:text-slate-700'
                    )}
                    aria-label="Grid view"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <Grid3X3 size={15} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-400 hover:text-slate-700'
                    )}
                    aria-label="List view"
                    aria-pressed={viewMode === 'list'}
                  >
                    <List size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Active Filters Bar (Chips) ───────────────── */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  Active filters:
                </span>

                {/* Search Query Chip */}
                {search && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                    <span>Search: "{search}"</span>
                    <button
                      onClick={() => setSearch('')}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove search filter"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                )}

                {/* Category Chip */}
                {filters.category && (
                  <Badge variant="primary" className="gap-1.5 py-1 px-2.5">
                    <span>Category: {filters.category}</span>
                    <button
                      onClick={() => handleFilterChange({ category: '' })}
                      className="text-brand-300 hover:text-white"
                      aria-label={`Remove ${filters.category} category filter`}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                )}

                {/* Price Chip */}
                {(filters.minPrice > 0 || filters.maxPrice < Infinity) && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                    <span>
                      Price:{' '}
                      {filters.minPrice > 0 && filters.maxPrice < Infinity
                        ? `${formatCurrency(filters.minPrice)} – ${formatCurrency(
                            filters.maxPrice
                          )}`
                        : filters.minPrice > 0
                        ? `Above ${formatCurrency(filters.minPrice)}`
                        : `Under ${formatCurrency(filters.maxPrice)}`}
                    </span>
                    <button
                      onClick={() =>
                        handleFilterChange({
                          minPrice: 0,
                          maxPrice: Infinity,
                          pricePresetIdx: 0,
                        })
                      }
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove price filter"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                )}

                {/* Rating Chip */}
                {filters.rating > 0 && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                    <span>Rating: {filters.rating}★ & above</span>
                    <button
                      onClick={() => handleFilterChange({ rating: 0 })}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove rating filter"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                )}

                {/* Brand Chips */}
                {filters.brands.map((b) => (
                  <Badge key={b} variant="secondary" className="gap-1.5 py-1 px-2.5">
                    <span>Brand: {b}</span>
                    <button
                      onClick={() =>
                        handleFilterChange({
                          brands: filters.brands.filter((brand) => brand !== b),
                        })
                      }
                      className="text-slate-400 hover:text-slate-700"
                      aria-label={`Remove ${b} brand filter`}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                ))}

                {/* In Stock Chip */}
                {filters.inStockOnly && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                    <span>In Stock Only</span>
                    <button
                      onClick={() => handleFilterChange({ inStockOnly: false })}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove in stock filter"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </Badge>
                )}

                {/* Clear All action */}
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Content States: Loading, Error, No Results, Catalog ─ */}
            {isLoading ? (
              /* Loading Skeleton Grid */
              <div
                className={cn(
                  'grid gap-5',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                )}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
                <ErrorState
                  title="Failed to Load Products"
                  description={error}
                  onRetry={fetchProducts}
                />
              </div>
            ) : productsData.products.length === 0 ? (
              /* No Results State */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card py-12 px-6">
                <EmptyState
                  icon={<Search size={32} className="text-slate-400" />}
                  title="No matching products found"
                  description="We couldn't find any products matching your active filters or search terms. Try loosening your criteria."
                  actionLabel="Clear all filters"
                  onAction={handleResetFilters}
                  size="lg"
                />
              </div>
            ) : (
              /* Main Products Grid / List */
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {productsData.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={isWishlisted(product.id)}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {productsData.products.map((product) => (
                      <ProductListItem
                        key={product.id}
                        product={product}
                        isWishlisted={isWishlisted(product.id)}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}

                {/* ── Pagination ──────────────────────────── */}
                {productsData.totalPages > 1 && (
                  <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
                    <p className="text-xs text-slate-500">
                      Page <strong className="text-slate-800">{productsData.page}</strong> of{' '}
                      <strong className="text-slate-800">{productsData.totalPages}</strong> (
                      {productsData.total} items)
                    </p>
                    <Pagination
                      currentPage={productsData.page}
                      totalPages={productsData.totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile Filter Drawer (Slide-over Sheet) ────────── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Off-canvas Sheet */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xs sm:max-w-sm bg-white shadow-modal flex flex-col overflow-y-auto animate-slide-in-right">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              onCloseMobile={() => setMobileDrawerOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
