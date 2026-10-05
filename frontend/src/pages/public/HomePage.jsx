import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  Zap,
  TrendingUp,
  Award,
  Package,
  Clock,
  Users,
  ThumbsUp,
  Check,
  ChevronLeft,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/product/ProductCard'
import { PRODUCTS, CATEGORIES } from '@/data/mockData'
import { productService } from '@/services/productService'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

// ─────────────────────────────────────────────────
// DATA SLICES
// ─────────────────────────────────────────────────
const TRENDING = PRODUCTS.filter(p => p.stockQuantity > 0).slice(0, 8)
const BEST_SELLERS = [...PRODUCTS].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4)
const DEALS = PRODUCTS.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 4)

const HERO_FEATURES = [
  { label: '10,000+ Products' },
  { label: 'Free Delivery over ₹999' },
  { label: 'Easy 30-day Returns' },
]

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: 'Free Delivery',
    desc: 'On all orders above ₹999. Express delivery available.',
    accent: '#6366f1',
    bg: 'from-indigo-50 to-blue-50',
  },
  {
    icon: RefreshCw,
    title: '30-Day Returns',
    desc: 'No questions asked. Full refund guaranteed.',
    accent: '#10b981',
    bg: 'from-emerald-50 to-teal-50',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    desc: '256-bit SSL encryption. All major cards accepted.',
    accent: '#f59e0b',
    bg: 'from-amber-50 to-orange-50',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Real humans, ready to help. Chat, email or call.',
    accent: '#8b5cf6',
    bg: 'from-purple-50 to-pink-50',
  },
]

const WHY_US = [
  {
    icon: Award,
    title: 'Curated Quality',
    desc: 'Every product is handpicked from verified suppliers and passes our strict quality standards before listing.',
  },
  {
    icon: Package,
    title: 'Careful Packaging',
    desc: 'Eco-friendly, damage-resistant packaging ensures your order arrives in perfect condition, every time.',
  },
  {
    icon: Clock,
    title: 'Fast Processing',
    desc: 'Orders are confirmed and packed within 12 hours. Same-day dispatch for orders placed before 2 PM.',
  },
  {
    icon: Users,
    title: 'Community First',
    desc: 'Over 50,000 happy customers and growing. Join a community that values trust and great experiences.',
  },
  {
    icon: ThumbsUp,
    title: 'Genuine Reviews',
    desc: 'Every review is from a verified purchase. No fake ratings. Real opinions from real customers.',
  },
  {
    icon: Zap,
    title: 'Best Prices',
    desc: 'Price-match guarantee on all listed products. If you find it cheaper elsewhere, we\'ll beat it.',
  },
]

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya Nair',
    location: 'Mumbai',
    avatar: 'P',
    avatarBg: '#6366f1',
    rating: 5,
    text: 'Absolutely love ShopSphere! The quality of products is unmatched and delivery was super fast. My headphones arrived in 2 days, perfectly packaged. Will definitely order again!',
    product: 'Wireless Headphones',
  },
  {
    id: 2,
    name: 'Arjun Patel',
    location: 'Bengaluru',
    avatar: 'A',
    avatarBg: '#10b981',
    rating: 5,
    text: 'The return process was seamless when I ordered the wrong size. Customer support was available at 10 PM and resolved everything. That\'s rare. Very impressed.',
    product: 'Running Shoes',
  },
  {
    id: 3,
    name: 'Kavya Reddy',
    location: 'Hyderabad',
    avatar: 'K',
    avatarBg: '#f59e0b',
    rating: 5,
    text: 'Best prices I\'ve found online for electronics. My Smart Watch is exactly as described — premium build, quick setup. The app experience is also really polished.',
    product: 'Smart Watch',
  },
]

// ─────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, actionLabel, actionHref, centered = false }) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-8', centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between')}>
      <div className={cn(centered ? 'max-w-xl' : '')}>
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 mb-2">
            <span className="w-4 h-px bg-brand-600 inline-block" />
            {eyebrow}
            <span className="w-4 h-px bg-brand-600 inline-block" />
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500 max-w-md">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && !centered && (
        <Link
          to={actionHref}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-semibold mt-2 sm:mt-0 shrink-0 group"
        >
          {actionLabel}
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────
// PRODUCT GRID SECTION (reusable)
// ─────────────────────────────────────────────────
function ProductGrid({ products, onWishlist, onAddToCart, badge, cols = 4 }) {
  return (
    <div className={cn(
      'grid gap-5',
      cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
      cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 sm:grid-cols-2'
    )}>
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          onWishlist={onWishlist}
          onAddToCart={onAddToCart}
          badge={badge ? badge(product, i) : undefined}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────
// CATEGORY CARD
// ─────────────────────────────────────────────────
function CategoryCard({ category }) {
  const ACCENT_COLORS = {
    electronics: { bg: 'from-indigo-500 to-blue-600', light: 'bg-indigo-50' },
    clothing: { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50' },
    books: { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50' },
    home: { bg: 'from-teal-500 to-emerald-600', light: 'bg-teal-50' },
    sports: { bg: 'from-green-500 to-lime-600', light: 'bg-green-50' },
    beauty: { bg: 'from-purple-500 to-fuchsia-600', light: 'bg-purple-50' },
    toys: { bg: 'from-yellow-500 to-amber-600', light: 'bg-yellow-50' },
    automotive: { bg: 'from-slate-600 to-slate-800', light: 'bg-slate-50' },
  }
  const colors = ACCENT_COLORS[category.slug] ?? ACCENT_COLORS.electronics

  return (
    <Link
      to={`/products?category=${category.slug}`}
      className={cn(
        'group relative flex flex-col items-center gap-3 p-5 rounded-2xl overflow-hidden',
        'border border-slate-100 bg-white',
        'shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
        'hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]',
        'hover:-translate-y-1 transition-all duration-300 ease-out',
        'cursor-pointer'
      )}
    >
      {/* Hover colour bleed from bottom */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        colors.bg
      )} />

      {/* Icon bubble */}
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl',
        'transition-transform duration-300 group-hover:scale-110',
        colors.light
      )}>
        {category.icon}
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{category.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{category.productCount.toLocaleString('en-IN')} items</p>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────
// STAT COUNTER (animated on scroll)
// ─────────────────────────────────────────────────
function StatCounter({ value, label, suffix = '' }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-black text-white tracking-tight tabular-nums">
        {value}<span className="text-brand-300">{suffix}</span>
      </p>
      <p className="text-sm text-brand-200 mt-1 font-medium">{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────
// TESTIMONIAL CARD
// ─────────────────────────────────────────────────
function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-4">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={14} className="text-amber-400 fill-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-sm text-slate-600 leading-relaxed italic flex-1">
        "{testimonial.text}"
      </p>

      {/* Product tag */}
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 rounded-full px-2.5 py-1 w-fit">
        <Check size={10} /> Verified: {testimonial.product}
      </span>

      {/* Author */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: testimonial.avatarBg }}
        >
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-slate-400">{testimonial.location}</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// NEWSLETTER SECTION
// ─────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSubmitted(true)
    toast.success('You\'re subscribed! 🎉 Welcome to ShopSphere.')
  }

  return (
    <section className="py-16 bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-400 mb-4">
          <span className="w-4 h-px bg-brand-400" />
          Stay in the loop
          <span className="w-4 h-px bg-brand-400" />
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Get Exclusive Deals<br />
          <span className="text-brand-400">Straight to Your Inbox</span>
        </h2>
        <p className="mt-3 text-brand-300 text-sm max-w-sm mx-auto">
          Subscribe to receive early access to sales, new arrivals, and members-only discount codes.
        </p>

        {submitted ? (
          <div className="mt-8 flex items-center justify-center gap-2 bg-white/10 rounded-2xl px-6 py-4 border border-white/20">
            <Check size={20} className="text-emerald-400" />
            <p className="text-white font-semibold">You're subscribed. Check your inbox!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address for newsletter"
              className={cn(
                'flex-1 h-12 px-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-brand-300',
                'text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white/15',
                'transition-all duration-200'
              )}
            />
            <button
              type="submit"
              className={cn(
                'h-12 px-6 rounded-xl bg-white text-brand-700 font-bold text-sm shrink-0',
                'hover:bg-brand-50 active:scale-[0.98]',
                'transition-all duration-150 shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
              )}
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-brand-400">
          No spam, ever. Unsubscribe with one click. 10,000+ subscribers.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { toggleWishlist } = useWishlist()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  // Fetch real products from Spring Boot REST API
  useEffect(() => {
    let isMounted = true
    async function loadProducts() {
      try {
        const res = await productService.getProducts({ limit: 12, sort: 'featured' })
        if (isMounted && res.products && res.products.length > 0) {
          setFeaturedProducts(res.products)
        }
      } catch (err) {
        console.warn('Failed to fetch home page featured products, fallback active:', err.message)
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false)
        }
      }
    }
    loadProducts()
    return () => {
      isMounted = false
    }
  }, [])

  // Dynamic slices backed by live API products (with graceful mock fallback)
  const trendingProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      const inStock = featuredProducts.filter((p) => p.stockQuantity > 0)
      return inStock.length > 0 ? inStock.slice(0, 8) : featuredProducts.slice(0, 8)
    }
    return TRENDING
  }, [featuredProducts])

  const bestSellerProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      return [...featuredProducts].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 4)
    }
    return BEST_SELLERS
  }, [featuredProducts])

  const dealProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      const deals = featuredProducts.filter((p) => p.originalPrice && p.originalPrice > p.price)
      return deals.length > 0 ? deals.slice(0, 4) : featuredProducts.slice(0, 4)
    }
    return DEALS
  }, [featuredProducts])

  const heroProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      return featuredProducts.slice(0, 4)
    }
    return PRODUCTS.slice(0, 4)
  }, [featuredProducts])

  const handleWishlist = async (product) => {
    await toggleWishlist(product)
  }

  const handleAddToCart = async (product) => {
    await addToCart(product, 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── 1. NAVBAR ──────────────────────────────── */}
      <Navbar />

      <main id="main-content" tabIndex="-1" className="flex-1">
        {/* ── 2. HERO ────────────────────────────────── */}
        <section className="relative bg-white overflow-hidden border-b border-slate-100">
        {/* Soft mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-50/80 blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-50/60 blur-3xl -translate-x-1/3 translate-y-1/3" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
            {/* Left: Copy */}
            <div className="flex flex-col gap-6">
              {/* Eyebrow pill */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-600/8 border border-brand-200 rounded-full text-xs font-bold text-brand-700 backdrop-blur-sm">
                  <Zap size={11} className="text-brand-500" />
                  New Collection • Summer 2024
                </span>
              </div>

              {/* Headline */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-slate-900 tracking-tight leading-[1.08]">
                  Discover{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-brand-600">Products</span>
                    {/* Underline SVG */}
                    <svg
                      aria-hidden="true"
                      className="absolute -bottom-1 left-0 w-full overflow-visible"
                      viewBox="0 0 200 8"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 6 Q50 0 100 5 Q150 10 200 4"
                        stroke="#818cf8"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <br />
                  You'll Love
                </h1>
              </div>

              {/* Sub-copy */}
              <p className="text-lg text-slate-500 leading-relaxed max-w-[460px]">
                Shop thousands of premium products from verified brands. Curated quality,
                fast delivery, and effortless returns — all in one place.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                {HERO_FEATURES.map(f => (
                  <span
                    key={f.label}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1.5"
                  >
                    <Check size={11} className="text-brand-600 shrink-0" />
                    {f.label}
                  </span>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => navigate('/products')}
                  className={cn(
                    'inline-flex items-center gap-2.5 h-12 px-7 rounded-xl',
                    'bg-brand-600 text-white font-bold text-base',
                    'shadow-[0_4px_14px_rgba(99,102,241,0.4)]',
                    'hover:bg-brand-700 hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]',
                    'active:scale-[0.97] transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
                  )}
                >
                  Shop Now
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/products?sort=discount')}
                  className={cn(
                    'inline-flex items-center gap-2 h-12 px-6 rounded-xl',
                    'border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm',
                    'hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50',
                    'active:scale-[0.97] transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
                  )}
                >
                  <TrendingUp size={16} className="text-brand-500" />
                  View Deals
                </button>
              </div>

              {/* Social proof row */}
              <div className="flex items-center gap-3 pt-2">
                {/* Avatar stack */}
                <div className="flex -space-x-2.5">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: color }}
                    >
                      {['R', 'A', 'K', 'P', 'D'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    <span className="text-slate-900 font-bold">4.9/5</span> from 50,000+ customers
                  </p>
                </div>
              </div>
            </div>

            {/* Right: floating product showcase */}
            <div className="hidden lg:flex items-center justify-center relative min-h-[480px]">
              {/* Background blob */}
              <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 border border-brand-100/50" />

              {/* Product grid inside */}
              <div className="relative z-10 grid grid-cols-2 gap-4 p-8 w-full">
                {heroProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className={cn(
                      'group bg-white rounded-2xl border border-slate-100 p-4',
                      'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
                      'hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]',
                      'hover:border-brand-200 hover:-translate-y-0.5',
                      'transition-all duration-300',
                      'flex flex-col items-center text-center gap-2.5'
                    )}
                  >
                    {/* Product emoji in coloured bubble */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${p.accent}18` }}
                    >
                      {p.emoji}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-tight">{p.name.split(' ').slice(0, 4).join(' ')}</p>
                      <p className="text-xs font-black text-brand-600 mt-1">{formatCurrency(p.price)}</p>
                    </div>
                    {p.originalPrice && (
                      <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                        -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Floating rating badge */}
              <div className="absolute -top-4 -right-2 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] px-4 py-2.5 flex items-center gap-2.5 z-20">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star size={17} className="text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">4.9 / 5</p>
                  <p className="text-[10px] text-slate-400 font-medium">50k+ reviews</p>
                </div>
              </div>

              {/* Floating deal badge */}
              <div className="absolute -bottom-4 -left-2 bg-brand-600 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.35)] px-4 py-2.5 z-20">
                <p className="text-xs font-black text-white">🎉 Up to 40% off</p>
                <p className="text-[10px] text-brand-200 font-medium mt-0.5">Limited time deals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST STRIP ─────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className="flex items-center gap-3 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${accent}15` }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="text-[11px] text-slate-500 leading-snug hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED CATEGORIES ─────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Browse"
            title="Shop by Category"
            subtitle="Find exactly what you're looking for across 8 curated departments."
            actionLabel="All categories"
            actionHref="/products"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TRENDING PRODUCTS ──────────────────── */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Hot right now"
            title="Trending Products"
            subtitle="The items everyone's talking about this week."
            actionLabel="Shop all trending"
            actionHref="/products?sort=popular"
          />
          <ProductGrid
            products={trendingProducts.slice(0, 4)}
            onWishlist={handleWishlist}
            onAddToCart={handleAddToCart}
            badge={(p, i) => i === 0 ? '🔥 Hot' : i === 1 ? '⭐ Top Rated' : undefined}
            cols={4}
          />

          {/* Second row — show 4 more on large screens */}
          {trendingProducts.length > 4 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {trendingProducts.slice(4, 8).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onWishlist={handleWishlist}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/products')}
              className={cn(
                'inline-flex items-center gap-2 h-11 px-8 rounded-xl',
                'border-2 border-brand-200 text-brand-700 font-semibold text-sm',
                'hover:bg-brand-600 hover:text-white hover:border-brand-600',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
              )}
            >
              View All Products
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. BEST SELLERS ───────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Community Picks"
            title="Best Sellers"
            subtitle="Loved by thousands of verified buyers. Consistently our highest-rated products."
            actionLabel="Shop best sellers"
            actionHref="/products?sort=popular"
          />
          <ProductGrid
            products={bestSellerProducts}
            onWishlist={handleWishlist}
            onAddToCart={handleAddToCart}
            badge={(_, i) => `#${i + 1} Best Seller`}
            cols={4}
          />
        </div>
      </section>

      {/* ── 7. PROMOTIONAL BANNER ─────────────────── */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950" />
            {/* Decorative orbs */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-brand-600/20 blur-3xl -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl -translate-y-1/2" />
            </div>
            {/* Dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Content */}
            <div className="relative px-8 sm:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left */}
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-amber-300 backdrop-blur-sm mb-4">
                  <Zap size={11} /> Flash Sale — Ends Sunday
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Up to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                    40% Off
                  </span>
                  <br />
                  Top Electronics
                </h2>
                <p className="mt-3 text-brand-300 text-sm max-w-sm leading-relaxed">
                  Premium headphones, smartwatches, keyboards — all discounted for a limited time.
                  No coupon code needed. Prices auto-applied.
                </p>

                {/* Mini deal highlights */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {dealProducts.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-[11px] font-semibold text-white/90 border border-white/10">
                      {p.emoji} {formatCurrency(p.price)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: deal cards preview */}
              <div className="flex gap-3 shrink-0">
                {dealProducts.slice(0, 3).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className={cn(
                      'group flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-5',
                      'hover:bg-white/20 transition-all duration-200',
                      i === 1 ? 'hidden sm:flex' : 'hidden md:flex',
                      i === 0 ? 'flex' : ''
                    )}
                  >
                    <span className="text-3xl">{p.emoji}</span>
                    <p className="text-[10px] font-semibold text-white/80 text-center leading-tight max-w-[80px]">
                      {p.name.split(' ').slice(0, 3).join(' ')}
                    </p>
                    <div className="text-center">
                      <p className="text-sm font-black text-white">{formatCurrency(p.price)}</p>
                      <p className="text-[10px] text-white/50 line-through">{formatCurrency(p.originalPrice)}</p>
                    </div>
                    <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                      -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Deal product cards below banner */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEALS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onWishlist={handleWishlist}
                onAddToCart={handleAddToCart}
                badge="🏷️ Deal"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS RIBBON ─────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCounter value="10,000" suffix="+" label="Products Listed" />
            <StatCounter value="50,000" suffix="+" label="Happy Customers" />
            <StatCounter value="500" suffix="+" label="Trusted Brands" />
            <StatCounter value="4.9" suffix="★" label="Average Rating" />
          </div>
        </div>
      </section>

      {/* ── 8. WHY SHOPSPHERE ─────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why us"
            title="Why ShopSphere?"
            subtitle="We obsess over every detail so you get the best shopping experience possible."
            centered
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {WHY_US.map(({ icon: Icon, title, desc }, i) => {
              const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6']
              const accent = COLORS[i]
              return (
                <div
                  key={title}
                  className={cn(
                    'group p-6 rounded-2xl border border-slate-100 bg-white',
                    'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                    'hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
                    'hover:-translate-y-0.5 transition-all duration-300'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${accent}12` }}
                  >
                    <Icon size={22} style={{ color: accent }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 9. CUSTOMER TRUST / TESTIMONIALS ──────── */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Social proof"
            title="Customers Love Us"
            subtitle="Real experiences from real shoppers. No incentivised or paid reviews."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {TESTIMONIALS.map(t => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* Trust badges row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: Shield, label: 'SSL Secured', sub: '256-bit encryption' },
              { icon: Award, label: 'Quality Assured', sub: 'Verified suppliers only' },
              { icon: Truck, label: 'Pan-India Delivery', sub: '18,000+ pincodes' },
              { icon: RefreshCw, label: 'Hassle-free Returns', sub: '30-day guarantee' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                  <Icon size={17} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* ── NEWSLETTER ────────────────────────────── */}
        <NewsletterSection />
      </main>

      {/* ── 10. FOOTER ────────────────────────────── */}
      <Footer />
    </div>
  )
}
