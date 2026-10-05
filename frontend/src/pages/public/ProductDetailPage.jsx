import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Plus,
  Minus,
  Share2,
  Check,
  Zap,
  Info,
  Package,
  RotateCcw,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/product/ProductCard'
import { Breadcrumbs, Button, Badge } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { ErrorState } from '@/components/shared/ErrorState'
import { productService } from '@/services/productService'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

// ─────────────────────────────────────────────────────────
// SPECIFICATIONS MAP BUILDER
// ─────────────────────────────────────────────────────────
function generateSpecifications(product) {
  return [
    { label: 'Brand', value: product.brand },
    { label: 'Category', value: product.category },
    { label: 'Model SKU', value: `SSP-${product.id.toString().padStart(4, '0')}-${product.brand.slice(0, 3).toUpperCase()}` },
    { label: 'Stock Availability', value: product.stockQuantity > 0 ? `${product.stockQuantity} units in warehouse` : 'Out of Stock' },
    { label: 'Warranty', value: '1 Year Manufacturer Limited Warranty' },
    { label: 'Country of Origin', value: 'India' },
    { label: 'Materials', value: 'Eco-friendly, Recyclable & Lead-free components' },
    { label: 'In the Box', value: '1x Product Unit, User Manual, Warranty Card, Safety Leaflet' },
  ]
}

// ─────────────────────────────────────────────────────────
// MOCK REVIEWS
// ─────────────────────────────────────────────────────────
const MOCK_REVIEWS = [
  {
    id: 1,
    author: 'Priya Nair',
    verified: true,
    rating: 5,
    date: 'August 14, 2024',
    title: 'Exceeded all my expectations!',
    comment:
      'Absolutely love this product. The build quality and attention to detail are top tier. Delivery was swift (arrived in 2 days in Mumbai). Highly recommended for anyone on the fence!',
  },
  {
    id: 2,
    author: 'Arjun Patel',
    verified: true,
    rating: 4,
    date: 'July 28, 2024',
    title: 'Great value for money',
    comment:
      'Very solid performance and sleek design. Packaging was sturdy and tamper-evident. Minor feedback: user guide could be slightly more detailed, but setup was otherwise effortless.',
  },
  {
    id: 3,
    author: 'Kavya Reddy',
    verified: true,
    rating: 5,
    date: 'July 15, 2024',
    title: 'Premium quality and fast shipping',
    comment:
      'Purchased this during the weekend promotion. It arrived ahead of schedule and works flawlessly. ShopSphere customer service was also super responsive when I asked for invoice details.',
  },
]

// ─────────────────────────────────────────────────────────
// STAR ROW HELPER
// ─────────────────────────────────────────────────────────
function StarRow({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={cn(
            'shrink-0',
            s <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN PRODUCT DETAIL PAGE
// ─────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { addToCart } = useCart()
  const { isWishlisted: checkWishlisted, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI Interactive States
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [heartBurst, setHeartBurst] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState('description') // 'description' | 'specifications' | 'shipping' | 'reviews'

  const isProductWishlisted = product ? checkWishlisted(product.id) : false

  // Fetch product from REST API
  useEffect(() => {
    let isMounted = true
    async function loadProduct() {
      setIsLoading(true)
      setError(null)
      try {
        const item = await productService.getProductById(id)
        if (!isMounted) return
        setProduct(item)
        setSelectedImageIdx(0)
        setQty(1)

        // Fetch related products
        const rel = await productService.getRelatedProducts(item.id, item.category, 4)
        if (isMounted) {
          setRelated(rel)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Product could not be found.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()
    return () => {
      isMounted = false
    }
  }, [id])

  // Calculations (guarded against null during load)
  const inStock = product ? product.stockQuantity > 0 : false
  const lowStock = inStock && product.stockQuantity <= 5
  const discount = product ? calcDiscountPercent(product.originalPrice, product.price) : 0
  const specifications = useMemo(() => (product ? generateSpecifications(product) : []), [product])

  // Gallery angles/views simulated for rich UX
  const galleryViews = useMemo(() => {
    if (!product) return []
    return [
      { label: 'Front Angle', icon: product.emoji || '📦', sub: 'Standard View' },
      { label: 'Side Profile', icon: '🔍', sub: 'Close-up Detail' },
      { label: 'In Use', icon: '✨', sub: 'Lifestyle View' },
      { label: 'Packaging', icon: '🎁', sub: 'Retail Packaging' },
    ]
  }, [product])

  // Quantity Handlers with strict bounds clamping
  const handleQtyChange = (val) => {
    if (!product || !inStock) return
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1) {
      setQty(1)
    } else if (num > product.stockQuantity) {
      setQty(product.stockQuantity)
      toast.error(`Only ${product.stockQuantity} items available in stock.`)
    } else {
      setQty(num)
    }
  }

  const handleQtyStep = (delta) => {
    if (!product || !inStock) return
    setQty((prev) => {
      const next = prev + delta
      if (next < 1) return 1
      if (next > product.stockQuantity) {
        toast.error(`Maximum available quantity is ${product.stockQuantity}`)
        return product.stockQuantity
      }
      return next
    })
  }

  const [isAdding, setIsAdding] = useState(false)

  // Add to Cart
  const handleAddToCart = async () => {
    if (!product || !inStock || isAdding) return
    setIsAdding(true)
    try {
      const res = await addToCart(product, qty)
      if (res) {
        setAddedToCart(true)
        setTimeout(() => setAddedToCart(false), 2000)
      }
    } catch {
      setAddedToCart(false)
    } finally {
      setIsAdding(false)
    }
  }

  // Instant Buy Now
  const handleBuyNow = async () => {
    if (!product || !inStock || isAdding) return
    setIsAdding(true)
    try {
      const res = await addToCart(product, qty, { openDrawer: false })
      if (res) {
        navigate('/checkout')
      }
    } catch {
      // Toast notification is managed by addToCart
    } finally {
      setIsAdding(false)
    }
  }

  // Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!product) return
    setHeartBurst(true)
    await toggleWishlist(product)
    setTimeout(() => setHeartBurst(false), 400)
  }

  // Share Product Link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard! 📋')
    } else {
      toast('Share URL: ' + window.location.href)
    }
  }

  // ── Loading Skeleton View ──────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 animate-pulse outline-none">
          <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
          <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-10 mb-10 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-6 aspect-square bg-slate-100 rounded-2xl" />
              <div className="lg:col-span-6 space-y-4">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-3/4 bg-slate-200 rounded" />
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Error / Not Found View ──────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 outline-none">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-10 max-w-2xl mx-auto">
            <ErrorState
              title="Product Not Found"
              description={error || "The product you are looking for doesn't exist or has been discontinued."}
              actionLabel="Browse All Products"
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

      <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 pb-24 md:pb-6 outline-none">
        {/* ── Breadcrumbs ───────────────────────────────── */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
          className="mb-6"
        />

        {/* ── Top Hero: Gallery & Primary Buy Box ────────── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden p-6 lg:p-10 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* ── Left Column: Image Gallery (5 cols) ──────── */}
            <div className="lg:col-span-6 flex flex-col gap-4 sticky top-24">
              {/* Main Image Stage */}
              <div
                className={cn(
                  'relative aspect-square rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 select-none shadow-xs',
                  'transition-all duration-300'
                )}
                style={{
                  background: `radial-gradient(circle at center, ${product.accent || '#6366f1'}12 0%, ${product.accent || '#6366f1'}25 100%)`,
                }}
              >
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {discount > 0 && inStock && (
                    <Badge variant="danger" size="md" className="font-bold shadow-xs">
                      Save {discount}%
                    </Badge>
                  )}
                  {lowStock && (
                    <Badge variant="warning" size="md" dot className="font-bold shadow-xs">
                      Only {product.stockQuantity} Left
                    </Badge>
                  )}
                </div>

                {/* Top Right Action (Share) */}
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-white hover:scale-105 transition-all"
                  aria-label="Share product"
                >
                  <Share2 size={16} />
                </button>

                {/* Main Emoji/Graphic Render */}
                <div className="text-8xl sm:text-9xl transform hover:scale-110 transition-transform duration-300 drop-shadow-md">
                  {galleryViews[selectedImageIdx].icon}
                </div>

                {/* Out of stock overlay */}
                {!inStock && (
                  <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 z-20 text-center">
                    <Badge variant="danger" size="lg" className="px-4 py-1.5 text-sm font-bold">
                      Sold Out
                    </Badge>
                    <p className="text-xs text-slate-500 max-w-xs">
                      This item is currently out of stock. Check back soon or browse related alternatives below.
                    </p>
                  </div>
                )}

                {/* Active View Label */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 border border-slate-200/60 shadow-xs">
                  {galleryViews[selectedImageIdx].label}
                </div>
              </div>

              {/* Thumbnails Strip */}
              <div className="grid grid-cols-4 gap-3" role="group" aria-label="Product views">
                {galleryViews.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View ${item.label}`}
                    aria-pressed={selectedImageIdx === idx}
                    className={cn(
                      'aspect-square rounded-xl p-2 border-2 transition-all flex flex-col items-center justify-center gap-1 text-center bg-slate-50/50 hover:bg-slate-50',
                      selectedImageIdx === idx
                        ? 'border-brand-600 bg-brand-50/30 shadow-xs scale-102'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Right Column: Info & Buy Controls (7 cols) ─ */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Brand & Title */}
              <div>
                <Link
                  to={`/products?brands=${encodeURIComponent(product.brand)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <span>{product.brand}</span>
                  <ChevronRight size={12} aria-hidden="true" />
                </Link>
                <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Ratings and Review Summary */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-100">
                <StarRow rating={product.rating} size={17} />
                <span className="text-sm font-bold text-slate-800">{product.rating}</span>
                <span className="text-slate-300" aria-hidden="true">•</span>
                <button
                  onClick={() => {
                    setActiveTab('reviews')
                    document.getElementById('details-tabs')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {product.reviewCount} customer reviews
                </button>
                <span className="text-slate-300" aria-hidden="true">•</span>
                <span className="text-xs text-slate-500">SKU: SSP-{product.id.toString().padStart(4, '0')}</span>
              </div>

              {/* Pricing Box */}
              <div className="flex flex-col gap-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-lg text-slate-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Inclusive of all taxes. Free shipping on orders over ₹999.
                </p>
              </div>

              {/* Stock Status Indicator */}
              <div className="flex items-center gap-3">
                {inStock ? (
                  <>
                    <StatusIndicator status={lowStock ? 'LOW_STOCK' : 'IN_STOCK'} />
                    {lowStock && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        ⚡ Hurry, only {product.stockQuantity} left in stock!
                      </span>
                    )}
                  </>
                ) : (
                  <StatusIndicator status="OUT_OF_STOCK" />
                )}
              </div>

              {/* Short Summary Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* ── Purchase Actions Section ──────────────── */}
              <div className="pt-2 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleQtyStep(-1)}
                      disabled={!inStock || qty <= 1}
                      className="w-10 h-12 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stockQuantity || 1}
                      value={qty}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      disabled={!inStock}
                      className="w-12 h-12 text-center text-sm font-bold text-slate-900 border-x border-slate-200 focus:outline-none disabled:bg-slate-50"
                      aria-label={`Quantity of ${product.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyStep(1)}
                      disabled={!inStock || qty >= product.stockQuantity}
                      className="w-10 h-12 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="lg"
                    fullWidth
                    disabled={!inStock || isAdding}
                    loading={isAdding}
                    onClick={handleAddToCart}
                    aria-label={inStock ? `Add to Cart • ${formatCurrency(product.price * qty)}` : `${product.name} is out of stock`}
                    className="h-12 text-base font-bold shadow-sm"
                  >
                    {addedToCart ? (
                      <>
                        <Check size={18} className="animate-scale-in" aria-hidden="true" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} aria-hidden="true" />
                        {inStock ? `Add to Cart • ${formatCurrency(product.price * qty)}` : 'Out of Stock'}
                      </>
                    )}
                  </Button>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className={cn(
                      'w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all shadow-xs',
                      isProductWishlisted
                        ? 'border-red-300 bg-red-50 text-red-500'
                        : 'border-slate-300 bg-white text-slate-500 hover:border-red-300 hover:text-red-500',
                      heartBurst && 'scale-115'
                    )}
                    aria-label={isProductWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    aria-pressed={isProductWishlisted}
                  >
                    <Heart size={20} className={cn(isProductWishlisted && 'fill-red-500')} aria-hidden="true" />
                  </button>
                </div>

                {/* Instant Buy Now button */}
                {inStock && (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={handleBuyNow}
                    className="h-11 font-bold border-brand-200 text-brand-700 hover:bg-brand-50/60"
                  >
                    <Zap size={16} className="text-brand-600" aria-hidden="true" />
                    Buy Now with 1-Click Checkout
                  </Button>
                )}
              </div>

              {/* Trust & Guarantee Strip */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-slate-50/50">
                  <Truck size={18} className="text-brand-600" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-slate-800">Fast Shipping</span>
                  <span className="text-[10px] text-slate-400">Dispatched in 24h</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-slate-50/50">
                  <ShieldCheck size={18} className="text-emerald-600" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-slate-800">Genuine Product</span>
                  <span className="text-[10px] text-slate-400">100% Authentic</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-slate-50/50">
                  <RefreshCw size={18} className="text-amber-600" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-slate-800">Easy Returns</span>
                  <span className="text-[10px] text-slate-400">30-Day Guarantee</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Tabs Section (Details, Specs, Shipping, Reviews) ─ */}
        <div id="details-tabs" className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden mb-12">
          {/* Tab Navigation Header */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none bg-slate-50/60" role="tablist" aria-label="Product information tabs">
            {[
              { id: 'description', label: 'Description & Features' },
              { id: 'specifications', label: 'Specifications' },
              { id: 'shipping', label: 'Shipping & Returns' },
              { id: 'reviews', label: `Reviews (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:bg-slate-100',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panes */}
          <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="p-6 lg:p-10 outline-none">
            
            {/* 1. Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Product Overview</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                    {product.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Key Features & Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-4xl">
                    {product.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={13} className="text-emerald-700" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Categorized Under
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((t) => (
                        <Link
                          key={t}
                          to={`/products?search=${encodeURIComponent(t)}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-xs font-semibold text-slate-600 rounded-full transition-colors"
                        >
                          #{t}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="max-w-3xl animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Technical Specifications</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {specifications.map((spec, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 hover:bg-slate-50/60 transition-colors">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider sm:col-span-1">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800 sm:col-span-2 mt-0.5 sm:mt-0">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Shipping & Returns Tab */}
            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl animate-fade-in">
                {/* Shipping Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-brand-600">
                    <Truck size={20} />
                    <h3 className="text-lg font-bold text-slate-900">Shipping Information</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <span><strong>Standard Delivery:</strong> 2–4 business days across India.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Zap size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <span><strong>Free Shipping:</strong> Automatically applied on orders over ₹999.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Package size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <span><strong>Safe Packaging:</strong> Tamper-evident, eco-friendly protective packaging.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <span><strong>Coverage:</strong> Delivering across 18,000+ pincodes in India.</span>
                    </li>
                  </ul>
                </div>

                {/* Return Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-amber-600">
                    <RotateCcw size={20} />
                    <h3 className="text-lg font-bold text-slate-900">30-Day Return Policy</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Hassle-Free:</strong> Return within 30 days of delivery if not satisfied.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Doorstep Pickup:</strong> Free reverse pickup arranged from your address.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Instant Refund:</strong> Processed directly to your payment source or bank.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. Customer Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-fade-in max-w-4xl">
                {/* Rating breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 items-center">
                  <div className="text-center md:border-r border-slate-200 pr-4">
                    <p className="text-5xl font-black text-slate-900">{product.rating}</p>
                    <div className="flex justify-center my-2">
                      <StarRow rating={product.rating} size={18} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Based on {product.reviewCount} ratings</p>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star === 5 ? 74 : star === 4 ? 18 : star === 3 ? 5 : star === 2 ? 2 : 1
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs font-medium text-slate-600">
                          <span className="w-6">{star} ★</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-slate-400">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-900">Customer Feedback</h4>
                  <div className="space-y-4">
                    {MOCK_REVIEWS.map((rev) => (
                      <div key={rev.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{rev.author}</span>
                            {rev.verified && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{rev.date}</span>
                        </div>
                        <StarRow rating={rev.rating} size={14} />
                        <h5 className="text-sm font-bold text-slate-800">{rev.title}</h5>
                        <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Related Products Carousel/Grid ────────────── */}
        {related.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Recommended For You
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  You May Also Like
                </h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
              >
                <span>View more in {product.category}</span>
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  isWishlisted={checkWishlisted(relProduct.id)}
                  onWishlist={() => toggleWishlist(relProduct)}
                  onAddToCart={() => addToCart(relProduct)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Mobile Sticky Bottom Action Bar (Bottom-friendly one-thumb action) ── */}
      {product && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
            <span className="text-base font-black text-slate-900 leading-tight">
              {formatCurrency(product.price * qty)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={cn(
                'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors',
                isProductWishlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-red-500'
              )}
              aria-label={isProductWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={cn(isProductWishlisted && 'fill-red-500')} />
            </button>

            <Button
              size="sm"
              disabled={!inStock}
              onClick={handleAddToCart}
              className="h-10 px-4 text-xs font-bold flex-1 max-w-[200px]"
            >
              {addedToCart ? (
                <>
                  <Check size={15} /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart size={15} /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
