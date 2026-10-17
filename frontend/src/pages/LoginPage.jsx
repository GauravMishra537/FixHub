import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

// Google redirect codes. Info = not an error, just a status message.
const GOOGLE_INFO = {
  REQUEST_CREATED: 'Request submitted. Waiting for admin approval. You can sign in with Google once approved.',
  PENDING_APPROVAL: 'Your request is still waiting for admin approval.',
}

const GOOGLE_ERRORS = {
  GOOGLE_CANCELLED: 'Google sign-in was cancelled.',
  GOOGLE_FAILED: 'Google sign-in failed. Please try again.',
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not configured.',
  STATE_INVALID: 'Sign-in session expired. Please try again.',
  EMAIL_NOT_VERIFIED: 'Your Google email is not verified.',
  ACCOUNT_REMOVED: 'This account is not available.',
  GOOGLE_MISMATCH: 'A different Google account is already linked to this user.',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const justVerified = Boolean(location.state?.verified)
  const justReset = Boolean(location.state?.reset)

  const googleCode = searchParams.get('error')
  const googleInfo = googleCode ? GOOGLE_INFO[googleCode] : null
  const googleError = googleCode && !googleInfo ? GOOGLE_ERRORS[googleCode] || 'Google sign-in failed.' : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login({ email, password })
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to FixHub</h1>
          <p className="mt-1 text-xs text-slate-500">
            Access your office requests, bookings, and administrator tools
          </p>
        </div>

        {justVerified && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 mb-6">
            Email verified. An administrator will review your account. You can sign in once it is approved.
          </div>
        )}

        {justReset && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 mb-6">
            Password updated. Sign in with your new password.
          </div>
        )}

        {googleInfo && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-6">
            {googleInfo}
          </div>
        )}

        {(error || googleError) && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 mb-6 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error || googleError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fixhub.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="my-5 flex items-center text-xs text-slate-400">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <a
          href="/api/auth/google/start"
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
        >
          Continue with Google
        </a>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Register new account
          </Link>
          <Link to="/" className="text-slate-600 hover:text-slate-900 inline-flex items-center font-medium">
            Back to Home <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage