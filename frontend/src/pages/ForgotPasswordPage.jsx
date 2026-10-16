import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { forgotPassword } from '../api/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset link. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot password</h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your work email and we will send a reset link
          </p>
        </div>

        {sent ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              If that email is registered, a reset link has been sent. The link works once and
              expires in 30 minutes. Check your spam folder too.
            </span>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 mb-6 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
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
                  placeholder="you@company.com"
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
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 text-xs">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 inline-flex items-center font-medium">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage