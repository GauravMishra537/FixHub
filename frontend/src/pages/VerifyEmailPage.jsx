import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail, resendVerification } from '../api/auth'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [inputToken, setInputToken] = useState(tokenFromUrl || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)

  const executeVerification = async (tokenToVerify) => {
    if (!tokenToVerify || !tokenToVerify.trim()) {
      setError('Please provide a valid verification token.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await verifyEmail(tokenToVerify.trim())
      setSuccess(true)
      try {
    localStorage.setItem('fixhub_email_verified', String(Date.now()))
     } catch {
     // storage blocked, ignore
     }
    } catch (err) {
      setError(err.message || 'Verification failed. The token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenFromUrl) {
      executeVerification(tokenFromUrl)
    }
  }, [tokenFromUrl])

  const handleSubmit = (e) => {
    e.preventDefault()
    executeVerification(inputToken)
  }

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail.trim()) return

    setResending(true)
    setResendMessage(null)

    try {
      await resendVerification(resendEmail.trim().toLowerCase())
      setResendMessage({
        type: 'success',
        text: 'A fresh verification link has been sent if an account exists for that address.',
      })
      setResendEmail('')
    } catch (err) {
      setResendMessage({
        type: 'error',
        text: err.message || 'Failed to resend verification link.',
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        {loading ? (
          <div className="py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Verifying Your Email</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we validate your security token...
            </p>
          </div>
        ) : success ? (
          <div>
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Verified Successfully</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your email address has been confirmed. Your account is now in the administrator approval queue.
            </p>

            <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Pending Administrator Review</span>
                Once an administrator approves your account, you will be able to log in and access all workspace features.
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Go to Login <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Mail className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Verification</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter the verification token sent to your work email address.
            </p>

            {error && (
              <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-left text-sm text-red-700 flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 text-left space-y-3">
              <label htmlFor="tokenInput" className="block text-xs font-medium text-slate-700">
                Verification Token
              </label>
              <input
                id="tokenInput"
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="e.g. 3b7c845b-99d6-44..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !inputToken.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Verify Token
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-left">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Need a new token?
              </h3>
              <form onSubmit={handleResend} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={resending || !resendEmail.trim()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center"
                  >
                    {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Resend'}
                  </button>
                </div>
                {resendMessage && (
                  <p
                    className={`text-xs mt-1 ${
                      resendMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {resendMessage.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
