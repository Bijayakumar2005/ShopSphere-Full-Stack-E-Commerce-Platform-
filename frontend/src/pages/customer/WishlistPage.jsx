import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, Badge, SkeletonProductCard } from '@/components/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { useWishlist } from '@/context/WishlistContext'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'

export default function WishlistPage() {
  const navigate = useNavigate()
  const {
    items,
    totalItems,
    removeFromWishlist,
    moveToCart,
    moveAllToCart,
    isLoading,
  } = useWishlist()

  const [movingIds, setMovingIds] = useState({})
  const [movingAll, setMovingAll] = useState(false)

  const handleMoveToCart = async (product) => {
    const id = product.productId || product.id
    setMovingIds((prev) => ({ ...prev, [id]: true }))
    try {
      await moveToCart(product)
    } finally {
      setMovingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleMoveAll = async () => {
    setMovingAll(true)
    try {
      await moveAllToCart()
    } finally {
      setMovingAll(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]} className="mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Wishlist
            {totalItems > 0 && (
              <span className="ml-2 text-lg font-normal text-slate-400">({totalItems})</span>
            )}
          </h1>
          {totalItems > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={movingAll || isLoading}
              loading={movingAll}
              onClick={handleMoveAll}
              className="font-semibold text-xs border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <ShoppingCart size={14} />
              {movingAll ? 'Moving Items…' : 'Move All to Cart'}
            </Button>
          )}
        </div>

        {isLoading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SkeletonProductCard key={n} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={<Heart size={32} />}
              title="Your wishlist is empty"
              description="Save products you love by clicking the heart icon on any product."
              actionLabel="Start Shopping"
              onAction={() => navigate('/products')}
              size="lg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((product) => {
              const discount = calcDiscountPercent(product.originalPrice, product.price)
              const inStock = (product.stockQuantity ?? 1) > 0
              const productId = product.productId || product.id
              const isMoving = !!movingIds[productId]

              return (
                <article
                  key={product.id || productId}
                  className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden group flex flex-col transition-all duration-200 hover:shadow-card-hover"
                >
                  {/* Image Stage */}
                  <div className="relative block">
                    <Link to={`/products/${productId}`} aria-label={`View ${product.name}`}>
                      <div
                        className="aspect-[4/3] bg-slate-100 flex items-center justify-center text-5xl overflow-hidden"
                        style={{
                          background: `radial-gradient(circle at center, ${product.accent || '#6366f1'}15 0%, ${product.accent || '#6366f1'}25 100%)`,
                        }}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="transform group-hover:scale-110 transition-transform duration-200">
                            {product.emoji || '📦'}
                          </span>
                        )}
                      </div>

                      {!inStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <Badge variant="danger" size="sm" className="font-bold">
                            Out of Stock
                          </Badge>
                        </div>
                      )}

                      {discount > 0 && inStock && (
                        <div className="absolute top-2.5 left-2.5">
                          <Badge variant="danger" size="sm" className="font-bold">
                            -{discount}%
                          </Badge>
                        </div>
                      )}
                    </Link>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        removeFromWishlist(productId, product.name)
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      {product.brand}
                    </p>
                    <Link to={`/products/${productId}`}>
                      <h3 className="text-sm font-semibold text-slate-900 hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mt-auto pt-1">
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Move to Cart CTA */}
                    <Button
                      fullWidth
                      size="sm"
                      disabled={!inStock || isMoving}
                      loading={isMoving}
                      onClick={() => handleMoveToCart(product)}
                      className="mt-2 font-semibold text-xs gap-1.5"
                    >
                      <ShoppingCart size={13} />
                      {isMoving ? 'Moving…' : inStock ? 'Move to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
