import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Eye, Check, Zap } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

/**
 * ProductImageFallback — a beautiful SVG-based fallback that never breaks.
 * Uses the product's accent colour and emoji for a polished look.
 */
function ProductImageFallback({ emoji = '📦', accent = '#6366f1', name }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none"
      style={{
        background: `linear-gradient(135deg, ${accent}12 0%, ${accent}22 100%)`,
      }}
    >
      {/* Soft blobs */}
      <div
        className="absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
          style={{ background: accent }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10"
          style={{ background: accent }}
        />
      </div>
      <span
        className="text-5xl relative z-10 drop-shadow-sm"
        role="img"
        aria-label={name}
      >
        {emoji}
      </span>
    </div>
  )
}

/**
 * StarRating — accessible read-only star row.
 */
function StarRating({ rating = 0, count = 0 }) {
  const rounded = Math.round(rating * 2) / 2 // round to nearest 0.5
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= Math.floor(rounded)
          const half = !filled && s === Math.ceil(rounded) && rounded % 1 !== 0
          return (
            <div key={s} className="relative">
              <Star
                size={12}
                className="text-slate-200 fill-slate-200 shrink-0"
              />
              {(filled || half) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? '50%' : '100%' }}
                >
                  <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {count > 0 && (
        <span className="text-xs text-slate-400 tabular-nums">({count.toLocaleString('en-IN')})</span>
      )}
    </div>
  )
}

/**
 * ProductCard — premium product card with:
 * - Beautiful no-URL image fallback (never breaks)
 * - Wishlist heart animation
 * - Add-to-cart feedback
 * - Hover slide-up actions overlay
 * - Full discount, rating, brand display
 *
 * @param {object} product
 * @param {boolean} isWishlisted
 * @param {function} onWishlist
 * @param {function} onAddToCart
 * @param {boolean} cartLoading
 * @param {string} [badge]  — optional top-left label e.g. "New"/"Trending"
 */
export const ProductCard = memo(function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onAddToCart,
  cartLoading = false,
  badge,
}) {
  const { addToCart } = useCart()
  const { isWishlisted: checkWishlisted, toggleWishlist } = useWishlist()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)

  const {
    id,
    name,
    brand,
    imageUrl,
    emoji = '📦',
    accent = '#6366f1',
    price,
    originalPrice,
    rating = 0,
    reviewCount = 0,
    stockQuantity = 0,
  } = product

  const wishlistedActive = isWishlisted !== undefined ? isWishlisted : checkWishlisted(id)
  const inStock = stockQuantity > 0
  const lowStock = inStock && stockQuantity <= 5
  const discount = calcDiscountPercent(originalPrice, price)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock || justAdded || isAdding) return

    setIsAdding(true)
    try {
      if (onAddToCart) {
        await onAddToCart(product)
      } else {
        await addToCart(product, 1)
      }
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
    } catch {
      // Handled via toast in CartContext
    } finally {
      setIsAdding(false)
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setHeartBurst(true)
    if (onWishlist) {
      onWishlist(product)
    } else {
      await toggleWishlist(product)
    }
    setTimeout(() => setHeartBurst(false), 400)
  }

  return (
    <article
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-200 overflow-hidden',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        'hover:shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]',
        'hover:-translate-y-1',
        'transition-all duration-300 ease-out',
        'flex flex-col',
        !inStock && 'opacity-85'
      )}
    >
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-50 aspect-[4/3] shrink-0">
        {/* Image / fallback link */}
        <Link
          to={`/products/${id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block w-full h-full"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
              <ProductImageFallback emoji={emoji} accent={accent} name={name} />
            </div>
          )}
        </Link>

        {/* Gradient scrim — gives bottom actions readable bg */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}
          aria-hidden="true"
        />

        {/* Out-of-stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 bg-white/90 rounded-full text-xs font-bold text-red-600 border border-red-200 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* ── Top-left badge cluster ── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {discount > 0 && inStock && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full shadow-sm">
              {badge}
            </span>
          )}
          {lowStock && !badge && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-sm">
              Only {stockQuantity} left
            </span>
          )}
        </div>

        {/* ── Wishlist button ── */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlistedActive ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wishlistedActive}
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm',
            'flex items-center justify-center shadow-md border',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            wishlistedActive
              ? 'border-red-200 text-red-500'
              : 'border-white/80 text-slate-400 hover:text-red-500 hover:border-red-200',
            heartBurst && 'scale-125'
          )}
        >
          <Heart
            size={14}
            className={cn(
              'transition-all duration-200',
              wishlistedActive ? 'fill-red-500 text-red-500' : '',
              heartBurst ? 'scale-125' : 'scale-100'
            )}
            aria-hidden="true"
          />
        </button>

        {/* ── Hover action bar ── */}
        <div
          className={cn(
            'absolute inset-x-3 bottom-3 flex gap-2',
            'translate-y-3 opacity-0',
            'group-hover:translate-y-0 group-hover:opacity-100',
            'transition-all duration-250 ease-out'
          )}
        >
          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || isAdding}
            className={cn(
              'flex-1 h-8 rounded-lg text-xs font-semibold',
              'flex items-center justify-center gap-1.5',
              'transition-all duration-200 shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
              inStock
                ? justAdded
                  ? 'bg-emerald-500 text-white border border-emerald-400'
                  : isAdding
                  ? 'bg-brand-500 text-white cursor-wait opacity-80'
                  : 'bg-white text-slate-800 border border-white/80 hover:bg-brand-600 hover:text-white hover:border-brand-600'
                : 'bg-white/60 text-slate-400 border border-white/60 cursor-not-allowed'
            )}
            aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
          >
            {isAdding ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                Adding…
              </>
            ) : justAdded ? (
              <>
                <Check size={12} className="shrink-0" aria-hidden="true" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart size={12} className="shrink-0" aria-hidden="true" />
                {inStock ? 'Add to Cart' : 'Unavailable'}
              </>
            )}
          </button>

          {/* Quick view */}
          <Link
            to={`/products/${id}`}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              'bg-white/95 text-slate-700 border border-white/80 shadow-sm',
              'hover:bg-brand-600 hover:text-white hover:border-brand-600',
              'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80'
            )}
            aria-label={`View details for ${name}`}
          >
            <Eye size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* ── Card body ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        {/* Brand */}
        {brand && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">
            {brand}
          </span>
        )}

        {/* Name */}
        <h3 className="min-h-[2.4em]">
          <Link
            to={`/products/${id}`}
            className="text-sm font-semibold text-slate-900 line-clamp-2 leading-[1.4] hover:text-brand-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            {name}
          </Link>
        </h3>

        {/* Rating */}
        <StarRating rating={rating} count={reviewCount} />

        {/* Price row */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {formatCurrency(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatCurrency(originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Mobile Quick Add-to-Cart Action (Visible on mobile/touch, hidden on desktop where hover bar is active) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || isAdding}
            className={cn(
              'sm:hidden w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-xs',
              inStock
                ? justAdded
                  ? 'bg-emerald-600 text-white'
                  : isAdding
                  ? 'bg-brand-500 text-white cursor-wait opacity-80'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
            aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
            title={inStock ? 'Add to cart' : 'Out of stock'}
          >
            {isAdding ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            ) : justAdded ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <ShoppingCart size={14} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  )
})
