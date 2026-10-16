import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../../api/auth'

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

export function ChangePasswordForm() {
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

export default ChangePasswordForm