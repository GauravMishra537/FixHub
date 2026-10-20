import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { UserCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCurrentUser, setPassword } from '../api/auth'
import ChangePasswordForm from '../components/account/ChangePasswordForm'
import MySkills from '../components/account/MySkills'
import ContactForm from '../components/account/ContactForm'
import PageHeader from '../components/common/PageHeader'
import Alert from '../components/common/Alert'

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/
const FIELD =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 text-right">{value || <span className="text-slate-400">Not set</span>}</dd>
    </div>
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

  const isAdminUser = profile?.role === 'ADMIN'

  return (
    <div>
      <PageHeader icon={UserCircle} title="My account" subtitle="Your details, password and skills." />

      {loading ? (
        <div className="flex items-center justify-center text-slate-500 text-sm py-10">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {notice && <Alert type="success">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}

          {profile && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-semibold text-slate-900 mb-2">Details</h2>
                  <dl className="divide-y divide-slate-100 text-sm">
                    <Row label="Name" value={profile.fullName} />
                    <Row label="Email" value={profile.email} />
                    <Row label="Role" value={profile.role} />
                    {!isAdminUser && (
                      <>
                        <Row label="Department" value={profile.departmentName} />
                        <Row label="Designation" value={profile.designation} />
                        <Row label="Work location" value={profile.workLocation} />
                        <Row label="Phone" value={profile.phoneNumber} />
                      </>
                    )}
                  </dl>
                                    {!isAdminUser && !profile.departmentName && (
                    <p className="mt-3 text-xs text-slate-500">Department and designation are set by an admin.</p>
                  )}
                  {!isAdminUser && <ContactForm key={`${profile.phoneNumber}-${profile.workLocation}`} profile={profile} onSaved={loadProfile} />}
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">Password</h2>
                  {profile.hasPassword ? (
                    isAdminUser ? (
                      <p className="text-xs text-slate-500">Administrator password cannot be changed from the app.</p>
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
                          className={FIELD}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm password</label>
                        <input
                          type="password"
                          required
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className={FIELD}
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
                </section>
              </div>

              {!isAdminUser && <MySkills />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AccountPage