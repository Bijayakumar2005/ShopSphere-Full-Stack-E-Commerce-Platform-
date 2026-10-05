import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Warehouse,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ExternalLink,
  ShieldCheck,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Inventory', href: '/admin/inventory', icon: Warehouse },
]

const Logo = () => (
  <Link to="/admin" className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
        <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold text-slate-900 leading-tight">
        Shop<span className="text-brand-600">Sphere</span>
      </p>
      <p className="text-[10px] text-slate-400 font-medium leading-tight uppercase tracking-wider">
        Business Admin
      </p>
    </div>
  </Link>
)

/**
 * AdminLayout — Enterprise-grade layout with responsive sidebar + topbar.
 */
export function AdminLayout({
  children,
  user: userProp,
  pageTitle,
  breadcrumbs,
  onLogout: onLogoutProp,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user: authUser, logout: authLogout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarOpen])

  const user = userProp || authUser || { name: 'Admin', email: 'admin@shopsphere.com' }
  const handleLogout = () => {
    if (onLogoutProp) {
      onLogoutProp()
    } else {
      authLogout()
      navigate('/login')
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            let badge = null
            if (item.label === 'Orders' && pendingOrdersCount > 0) {
              badge = (
                <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                  {pendingOrdersCount}
                </span>
              )
            } else if ((item.label === 'Inventory' || item.label === 'Products') && lowStockCount > 0 && item.label === 'Inventory') {
              badge = (
                <span className="ml-auto text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full">
                  {lowStockCount}
                </span>
              )
            }

            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                      'transition-colors duration-150 group',
                      isActive
                        ? 'bg-brand-50 text-brand-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    )
                  }
                >
                  <item.icon
                    size={18}
                    className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors"
                  />
                  <span className="truncate">{item.label}</span>
                  {badge}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {/* Quick Link to Store */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={15} className="text-slate-400" />
              View Live Store
            </span>
            <ExternalLink size={13} className="text-slate-400" />
          </Link>
        </div>
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email || 'Administrator'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-150"
        >
          <LogOut size={15} className="text-slate-400 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50/60 overflow-hidden font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 shadow-xs z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop and sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin Navigation">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-10">
          {/* Left: Mobile hamburger & breadcrumbs/title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              {breadcrumbs || (
                pageTitle && (
                  <h1 className="text-base font-semibold text-slate-900 truncate">
                    {pageTitle}
                  </h1>
                )
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" aria-hidden="true" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">System Notifications</span>
                    <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">All Good</span>
                  </div>
                  <div className="py-2 text-xs text-slate-600 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      Database & API servers online
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Catalog inventory synchronized in real-time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* View store link */}
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <span>Live Store</span>
              <ExternalLink size={13} aria-hidden="true" />
            </Link>

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <Badge variant="primary" size="sm" className="font-semibold">
                ADMIN
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" tabIndex="-1" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50/50 outline-none">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
