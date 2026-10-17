import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getGoogleStatus, startGoogleLink } from '../../api/auth'

const MESSAGES = {
  LINKED: { ok: true, text: 'Google account connected. You can now sign in with Google.' },
  EMAIL_MISMATCH: {
    text: 'That Google account uses a different email. Pick the Google account with the same email as this account.',
  },
  ALREADY_LINKED: { text: 'A Google account is already connected.' },
  GOOGLE_IN_USE: { text: 'That Google account is already connected to another user.' },
  GOOGLE_CANCELLED: { text: 'Google connection was cancelled.' },
  GOOGLE_FAILED: { text: 'Could not reach Google. Please try again.' },
  STATE_INVALID: { text: 'Connection session expired. Please try again.' },
  EMAIL_NOT_VERIFIED: { text: 'Your Google email is not verified.' },
  DOMAIN_NOT_ALLOWED: { text: 'This email domain is not allowed.' },
  ACCOUNT_REMOVED: { text: 'Account not available.' },
}

export function GoogleConnect() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [linked, setLinked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const resultCode = searchParams.get('google')
  const result = resultCode ? MESSAGES[resultCode] || { text: 'Google connection failed.' } : null

  useEffect(() => {
    getGoogleStatus()
      .then((data) => setLinked(Boolean(data.linked)))
      .catch((err) => setError(err.message || 'Could not load Google status.'))
  }, [resultCode])

  const connect = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await startGoogleLink()
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Could not start the Google connection.')
      setBusy(false)
    }
  }

  const dismiss = () => {
    searchParams.delete('google')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-800">Google sign-in</h2>

      {result && (
        <div
          className={`p-3 rounded-xl border text-xs flex justify-between ${
            result.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span>{result.text}</span>
          <button type="button" onClick={dismiss} className="underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}

      {linked === null ? (
        <div className="text-xs text-slate-500 flex items-center">
          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Checking...
        </div>
      ) : linked ? (
        <p className="text-xs text-emerald-700">Google account connected.</p>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-semibold transition-colors"
        >
          {busy ? 'Redirecting...' : 'Connect Google'}
        </button>
      )}
    </div>
  )
}

export default GoogleConnect