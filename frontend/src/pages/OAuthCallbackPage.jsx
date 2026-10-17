import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { exchangeGoogleCode } from '../api/auth'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeLogin } = useAuth()
  const [error, setError] = useState(null)
  const started = useRef(false)

  useEffect(() => {
    // Code works once. Guard stops StrictMode from calling twice.
    if (started.current) return
    started.current = true

    const code = searchParams.get('code')
    if (!code) {
      setError('Sign-in code is missing. Please try again.')
      return
    }

    exchangeGoogleCode(code)
      .then((data) => {
        const user = completeLogin(data)
        if (!user.hasPassword) {
          navigate('/account', { replace: true }) // Google-only user sets password here
        } else if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch((err) => setError(err.message || 'Google sign-in failed. Please try again.'))
  }, [])

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      {error ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Link to="/login" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-center text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing you in...
        </div>
      )}
    </div>
  )
}

export default OAuthCallbackPage