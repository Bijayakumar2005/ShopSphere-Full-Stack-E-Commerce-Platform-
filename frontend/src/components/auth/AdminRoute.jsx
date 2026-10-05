import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner, Button } from '@/components/ui'
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-card border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <ShieldAlert size={32} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            403 Forbidden
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            You do not have administrator permissions to access this area. If you believe this is an error, please log in with an administrator account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5"
            >
              <ArrowLeft size={14} /> Go Back
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5"
            >
              <Home size={14} /> Return to Store
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

