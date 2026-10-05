import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  ChevronDown,
  Bell,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, Dropdown } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'Deals', href: '/deals' },
]

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-700 transition-colors duration-150">
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z"
          fill="white"
        />
        <path
          d="M11 10V8a5 5 0 0 1 10 0v2"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <span className="text-base font-bold text-slate-900 tracking-tight">
      Shop<span className="text-brand-600">Sphere</span>
    </span>
  </Link>
)

const IconBtn = ({ children, badge, label, to, onClick }) => {
  const cls = cn(
    'relative flex items-center justify-center w-9 h-9 rounded-md',
    'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
  )
  const content = (
    <>
      {children}
      {badge > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
            'bg-brand-600 text-white text-[10px] font-bold rounded-full',
            'flex items-center justify-center leading-none'
          )}
          aria-label={`${badge} items`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  )

  if (to)
    return (
      <Link to={to} className={cls} aria-label={label}>
        {content}
      </Link>
    )
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      {content}
    </button>
  )
}

/**
 * Navbar — responsive top navigation bar.
 *
 * Props (all optional — will be wired to stores later):
 * @param {number} cartCount
 * @param {number} wishlistCount
 * @param {boolean} isLoggedIn
 * @param {object} user — { name, role }
 * @param {function} onLogout
 */
export function Navbar({
  cartCount,
  wishlistCount,
  isLoggedIn,
  user,
  onLogout,
}) {
  const auth = useAuth()
  const { totalItems, openCartDrawer } = useCart()
  const { totalItems: totalWishlistItems } = useWishlist()
  const activeCartCount = cartCount !== undefined ? cartCount : totalItems
  const activeWishlistCount = wishlistCount !== undefined ? wishlistCount : totalWishlistItems
  const activeUser = user !== undefined ? user : auth.user
  const activeLoggedIn = isLoggedIn !== undefined ? isLoggedIn : auth.isAuthenticated
  const isUserAdmin = auth.isAdmin || (activeUser?.role || '').toUpperCase() === 'ADMIN' || (activeUser?.role || '').toUpperCase() === 'ROLE_ADMIN'
  const handleLogout = onLogout || auth.logout
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const userMenuItems = [
    { label: 'My Profile', icon: <User size={14} />, onClick: () => navigate('/profile') },
    { label: 'My Orders', icon: <Package size={14} />, onClick: () => navigate('/orders') },
    ...(isUserAdmin
      ? [
          { divider: true },
          {
            label: 'Admin Dashboard',
            icon: <LayoutDashboard size={14} />,
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
    { divider: true },
    {
      label: 'Sign Out',
      icon: <LogOut size={14} />,
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-white border-b border-slate-200',
        'transition-shadow duration-200',
        scrolled && 'shadow-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'text-brand-600 bg-brand-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Search bar (desktop) */}
          <div className="hidden lg:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                className={cn(
                  'w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50',
                  'text-sm text-slate-900 placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white',
                  'transition-all duration-150'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`)
                  }
                }}
              />
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            {/* Mobile search */}
            <IconBtn label="Search" onClick={() => navigate('/products')}>
              <Search size={18} />
            </IconBtn>

            <IconBtn to="/wishlist" label={`Wishlist (${activeWishlistCount})`} badge={activeWishlistCount}>
              <Heart size={18} />
            </IconBtn>

            <IconBtn
              onClick={openCartDrawer}
              label={`Cart (${activeCartCount})`}
              badge={activeCartCount}
            >
              <ShoppingCart size={18} />
            </IconBtn>

            {/* Auth */}
            {activeLoggedIn && activeUser ? (
              <Dropdown
                trigger={
                  <button
                    className={cn(
                      'flex items-center gap-2 pl-2 pr-2.5 h-9 rounded-md',
                      'text-sm font-medium text-slate-700',
                      'hover:bg-slate-100 transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                    )}
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {activeUser.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {activeUser.name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className={cn(
                'md:hidden flex items-center justify-center w-9 h-9 rounded-md ml-1',
                'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-fade-in-up">
          <div className="px-4 py-4 space-y-1">
            {/* Mobile search */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setMobileOpen(false)
                    navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`)
                  }
                }}
                className={cn(
                  'w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50',
                  'text-sm placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white'
                )}
              />
            </div>

            <nav className="space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium',
                      isActive
                        ? 'text-brand-600 bg-brand-50 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {!activeLoggedIn ? (
              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/login')
                  }}
                >
                  Sign in
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/register')
                  }}
                >
                  Get started
                </Button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {activeUser?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{activeUser?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{activeUser?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      navigate('/profile')
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <User size={13} /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      navigate('/orders')
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Package size={13} /> My Orders
                  </button>
                </div>

                {isUserAdmin && (
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      navigate('/admin')
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100"
                  >
                    <LayoutDashboard size={14} /> Admin Dashboard
                  </button>
                )}

                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false)
                    handleLogout()
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut size={13} className="mr-1.5" /> Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
