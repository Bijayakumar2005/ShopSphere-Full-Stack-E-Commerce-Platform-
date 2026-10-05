import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { authService } from '@/services/authService'
import { toast } from 'react-hot-toast'

const BENEFITS = [
  'Track your orders in real-time',
  'Save products to your wishlist',
  'Exclusive member-only deals',
  'Fast checkout with saved addresses',
  'Hassle-free 30-day returns',
]

export default function RegisterPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agree: true })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()

    if (!trimmedName) {
      e.name = 'Full name is required.'
    } else if (trimmedName.length < 2) {
      e.name = 'Full name must be at least 2 characters.'
    }

    if (!trimmedEmail) {
      e.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      e.email = 'Please enter a valid email address.'
    }

    if (!form.password) {
      e.password = 'Password is required.'
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.'
    }

    if (!form.confirm) {
      e.confirm = 'Please confirm your password.'
    } else if (form.confirm !== form.password) {
      e.confirm = 'Passwords do not match.'
    }

    if (!form.agree) {
      e.agree = 'You must agree to the Terms of Service and Privacy Policy.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    setErrors({})
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      toast.success('Account created successfully! Please sign in. 🎉')
      navigate('/login', { state: { registeredEmail: form.email.trim() } })
    } catch (err) {
      const validationErrors = err.response?.data?.validationErrors
      if (validationErrors && typeof validationErrors === 'object') {
        setErrors(validationErrors)
        const firstErr = Object.values(validationErrors)[0]
        toast.error(firstErr || 'Please check the entered details.')
      } else {
        const errorMsg =
          err.response?.data?.message || 'Failed to create account. Please try again.'
        toast.error(errorMsg)
        setErrors({ form: errorMsg })
      }
      // Preserve non-password data (name, email) while clearing password fields
      setForm((prev) => ({
        ...prev,
        password: '',
        confirm: '',
      }))
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    if (!form.password) return 0
    let s = 0
    if (form.password.length >= 6) s++
    if (/[A-Z]/.test(form.password)) s++
    if (/[0-9]/.test(form.password)) s++
    if (/[^A-Za-z0-9]/.test(form.password)) s++
    return s
  })()

  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'][strength]
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-brand-900 to-indigo-900 items-center justify-center relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-purple-400 blur-3xl" />
        </div>
        <div className="relative z-10 p-12">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
                <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
                <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ShopSphere</span>
          </Link>
          <h2 className="text-3xl font-bold text-white leading-tight">Join 50,000+<br />happy shoppers</h2>
          <p className="mt-3 text-brand-200 text-sm leading-relaxed">
            Create your free account and unlock exclusive member benefits.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3 text-brand-100">
                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <main id="main-content" tabIndex="-1" className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
                  <path d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z" fill="white" />
                  <path d="M11 10V8a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">Shop<span className="text-brand-600">Sphere</span></span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
              <p className="mt-1 text-sm text-slate-500">
                Already have one?{' '}
                <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in</Link>
              </p>
            </div>

            {errors.form && (
              <div role="alert" className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="Full name"
                placeholder="Riya Sharma"
                leftIcon={<User size={15} />}
                required
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                autoComplete="name"
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                required
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  leftIcon={<Lock size={15} />}
                  required
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="flex items-center gap-2 -mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColor : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{strengthLabel}</span>
                </div>
              )}

              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                leftIcon={<Lock size={15} />}
                required
                value={form.confirm}
                onChange={set('confirm')}
                error={errors.confirm}
                autoComplete="new-password"
              />

              <div className="flex flex-col gap-1 mt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))}
                    className="accent-brand-600 mt-0.5 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the{' '}
                    <span className="text-brand-600 font-medium">Terms of Service</span> and{' '}
                    <span className="text-brand-600 font-medium">Privacy Policy</span>
                  </span>
                </label>
                {errors.agree && (
                  <span className="text-xs text-red-500 font-medium">{errors.agree}</span>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                disabled={loading}
                className="mt-2 font-bold"
              >
                Create Account
                <ArrowRight size={17} />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
