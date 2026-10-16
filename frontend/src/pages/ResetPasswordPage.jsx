import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, AlertCircle, Loader2 } from 'lucide-react'
import { resetPassword } from '../api/auth'

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be 8-72 characters with an uppercase letter, a lowercase letter and a digit.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      navigate('/login', { state: { reset: true } })
    } catch (err) {
      setError(err.message || 'Could not reset the password. Request a new link.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">Reset link is missing</h1>
          <p className="mt-2 text-xs text-slate-500">Open the link from your email, or request a new one.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-xs text-blue-600 hover:text-blue-800 font-medium">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-xs text-slate-500">8+ characters with upper, lower and a digit</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 mb-6 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Update password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage