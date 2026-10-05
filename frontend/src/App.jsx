import { lazy, Suspense, Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ProductsPage = lazy(() => import('@/pages/public/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/public/ProductDetailPage'))
const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'))

// Customer pages
const CartPage = lazy(() => import('@/pages/customer/CartPage'))
const WishlistPage = lazy(() => import('@/pages/customer/WishlistPage'))
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'))
const MyOrdersPage = lazy(() => import('@/pages/customer/MyOrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'))

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminProductForm = lazy(() => import('@/pages/admin/AdminProductForm'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers'))
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'))
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory'))

// Design system (kept for reference)
const DesignSystemPage = lazy(() => import('@/pages/DesignSystem'))

// Route guards
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { CartDrawer } from '@/components/cart/CartDrawer'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('💥 [ShopSphere ErrorBoundary]: Unhandled React rendering error:', error)
    if (errorInfo?.componentStack) {
      console.error('💥 [Component Stack Trace]:\n', errorInfo.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV)
      const errorMsg = this.state.error?.message || 'An unexpected error occurred while loading this page.'
      const isNetworkError = this.state.error?.isAxiosError || this.state.error?.name === 'AxiosError'

      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-bold shadow-xs">
            ⚠️
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isNetworkError ? 'Network Connection Issue' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            {isNetworkError
              ? 'Failed to communicate with the ShopSphere API server. Please ensure the backend is running.'
              : 'An unexpected application error occurred while rendering this page.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                this.handleReset()
                window.location.assign('/')
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Return Home
            </button>
          </div>

          {/* Development / Diagnosable Error Details */}
          {(isDev || this.state.error) && (
            <details className="mt-4 text-left max-w-2xl w-full bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-auto max-h-72 border border-slate-800 shadow-lg">
              <summary className="cursor-pointer text-red-400 font-semibold mb-2 select-none hover:underline">
                [Diagnostics] {this.state.error?.name || 'Error'}: {errorMsg}
              </summary>
              {this.state.error?.stack && (
                <div className="mt-2 text-slate-300 whitespace-pre-wrap opacity-90 border-t border-slate-800 pt-2">
                  <p className="text-amber-400 font-bold mb-1">Stack Trace:</p>
                  {this.state.error.stack}
                </div>
              )}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-2 text-slate-400 whitespace-pre-wrap border-t border-slate-800 pt-2">
                  <p className="text-blue-400 font-bold mb-1">Component Stack:</p>
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8">
      <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-sm animate-pulse">
        <Loader2 className="animate-spin text-brand-600" size={24} />
      </div>
      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase animate-pulse">
        Loading ShopSphere…
      </p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:font-semibold focus:text-sm focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <CartDrawer />
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
      {/* ── Public ───────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Convenience aliases */}
      <Route path="/categories" element={<ProductsPage />} />
      <Route path="/deals" element={<ProductsPage />} />

      {/* ── Customer (Protected) ────────────────────────── */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MyOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin (Admin Protected) ──────────────────────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/add"
        element={
          <AdminRoute>
            <AdminProductForm mode="add" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/:id/edit"
        element={
          <AdminRoute>
            <AdminProductForm mode="edit" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <AdminRoute>
            <AdminCustomers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminCustomers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminCategories />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <AdminRoute>
            <AdminInventory />
          </AdminRoute>
        }
      />

      {/* Design system reference */}
      <Route path="/design-system" element={<DesignSystemPage />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 px-4">
      <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
          <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
          <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-700">Page not found</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          ← Go Home
        </a>
        <a
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Browse Products
        </a>
      </div>
    </div>
  )
}
