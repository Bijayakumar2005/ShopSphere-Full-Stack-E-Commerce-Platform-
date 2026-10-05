import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'react-hot-toast'

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-xs">
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
        <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
        <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
    <span className="text-lg font-bold text-slate-900">Shop<span className="text-brand-600">Sphere</span></span>
  </Link>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})

  const from = location.state?.from?.pathname || '/'

  // Redirect if already authenticated to prevent unnecessary login view
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        const target = from === '/login' || from.startsWith('/admin') ? '/' : from
        navigate(target, { replace: true })
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate, from])

  const validate = () => {
    const e = {}
    const trimmedEmail = form.email.trim()
    if (!trimmedEmail) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      e.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      e.password = 'Password is required.'
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const data = await login(form.email.trim(), form.password)
      toast.success(`Welcome back, ${data.user.name}!`)
      if (data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        const target = from === '/login' || from.startsWith('/admin') ? '/' : from
        navigate(target, { replace: true })
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Invalid email or password. Please try again.'
      toast.error(errorMsg)
      setErrors({ form: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative z-10 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
              <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
              <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome back!</h2>
          <p className="mt-3 text-brand-200 max-w-xs mx-auto">
            Sign in to access your orders, wishlist, and personalized recommendations.
          </p>
          <div className="mt-10 flex flex-col gap-4 max-w-xs mx-auto text-left">
            {['10,000+ Products', 'Fast Pan-India Delivery', '30-Day Easy Returns', 'Safe & Secure Checkout'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-brand-100">
                <ShieldCheck size={16} className="text-brand-400 shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <main id="main-content" tabIndex="-1" className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-600 hover:text-brand-700 font-semibold">
                  Create Account
                </Link>
              </p>
            </div>

            {location.state?.registeredEmail && (
              <div role="status" className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
                <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                <span>Account created successfully! Please sign in with your credentials.</span>
              </div>
            )}

            {errors.form && (
              <div role="alert" className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                required
                value={form.email}
                onChange={(e) => {
                  const val = e.target.value
                  setForm((f) => ({ ...f, email: val }))
                  if (errors.email || errors.form) {
                    setErrors((prev) => ({ ...prev, email: null, form: null }))
                  }
                }}
                error={errors.email}
                autoComplete="email"
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  leftIcon={<Lock size={15} />}
                  required
                  value={form.password}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, password: val }))
                    if (errors.password || errors.form) {
                      setErrors((prev) => ({ ...prev, password: null, form: null }))
                    }
                  }}
                  error={errors.password}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                disabled={loading}
                className="mt-2 font-bold"
              >
                Sign in
                <ArrowRight size={17} />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
