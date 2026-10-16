import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { UserCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCurrentUser, setPassword, changePassword } from '../api/auth'


const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!PASSWORD_RULE.test(next)) {
      setError('Password must be 8-72 characters with an uppercase letter, a lowercase letter and a digit.')
      return
    }
    if (next !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      await changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setNotice('Password changed.')
    } catch (err) {
      setError(err.message || 'Could not change the password.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Change password</h2>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">{notice}</div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Current password</label>
        <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
        <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm new password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        {saving ? 'Saving...' : 'Change password'}
      </button>

      <p className="text-xs text-slate-500">
        Forgot the current one? Use{' '}
        <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
          Forgot password
        </Link>
        .
      </p>
    </form>
  )
}

export function AccountPage() {
  const { isAuthenticated } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProfile = async () => {
    try {
      setProfile(await getCurrentUser())
    } catch (err) {
      setError(err.message || 'Could not load your account.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be 8-72 characters with an uppercase letter, a lowercase letter and a digit.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      await setPassword(password)
      setPasswordValue('')
      setConfirm('')
      setNotice('Password set. You can now sign in with email and password.')
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Could not set the password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <UserCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My account</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center text-slate-500 text-sm py-6">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {notice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 mb-6 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 mb-6 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {profile && (
              <>
                <dl className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium text-slate-900">{profile.fullName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">{profile.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Role</dt>
                    <dd className="font-medium text-slate-900">{profile.role}</dd>
                  </div>
                </dl>

                <div className="pt-5 border-t border-slate-100">
                 {profile.hasPassword ? (
                profile.role === 'ADMIN' ? (
                <p className="text-xs text-slate-500">
                Administrator password cannot be changed from the app.
                </p>
                ) : (
                <ChangePasswordForm />
                )

                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <p className="text-xs text-slate-500">
                        Your account has no password yet. Set one to sign in with email and password.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">New password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPasswordValue(e.target.value)}
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
                        disabled={saving}
                        className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Set password'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AccountPage