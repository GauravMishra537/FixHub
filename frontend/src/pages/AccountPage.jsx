import React, { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { UserCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCurrentUser, setPassword } from '../api/auth'
import { orgApi } from '../api/org'
import ChangePasswordForm from '../components/account/ChangePasswordForm'
import PageHeader from '../components/common/PageHeader'
import Alert from '../components/common/Alert'
import EditBar from '../components/common/EditBar'
import { EditableText } from '../components/common/Editable'
import SkillsEditor from '../components/common/SkillsEditor'

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/
const PHONE_RULE = /^$|^[0-9+()\-\s]{6,20}$/
const FIELD =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 max-w-[65%] text-right font-medium text-slate-900">{children}</dd>
    </div>
  )
}

const Plain = ({ v }) => (v ? <span className="px-2">{v}</span> : <span className="px-2 text-slate-400">Not set</span>)

const draftFrom = (p, mine) => ({
  phoneNumber: p.phoneNumber || '',
  workLocation: p.workLocation || '',
  skills: mine.map((m) => ({
    key: `l${m.id}`,
    id: m.skillId,
    linkId: m.id,
    name: m.skillName,
    status: m.status,
    reason: m.rejectReason,
  })),
})

export function AccountPage() {
  const { isAuthenticated } = useAuth()

  const [profile, setProfile] = useState(null)
  const [mine, setMine] = useState([])
  const [activeSkills, setActiveSkills] = useState([])
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const [p, m, a] = await Promise.all([getCurrentUser(), orgApi.mySkills(), orgApi.activeSkills()])
      setProfile(p)
      setMine(m || [])
      setActiveSkills(a || [])
      setDraft(draftFrom(p, m || []))
    } catch (err) {
      setError(err.message || 'Could not load your account.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
    }
  }, [isAuthenticated, loadProfile])

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

    setSettingPassword(true)
    try {
      await setPassword(password)
      setPasswordValue('')
      setConfirm('')
      setNotice('Password set. You can now sign in with email and password.')
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Could not set the password.')
    } finally {
      setSettingPassword(false)
    }
  }

  const isAdminUser = profile?.role === 'ADMIN'

  // ---------- what changed ----------
  let dirty = false
  let removedLinks = []
  let addedSkills = []
  let contactChanged = false
  let problem = ''
  if (profile && draft && !isAdminUser) {
    const keptLinkIds = draft.skills.filter((s) => s.linkId).map((s) => s.linkId)
    removedLinks = mine.filter((m) => !keptLinkIds.includes(m.id))
    addedSkills = draft.skills.filter((s) => !s.linkId)
    contactChanged =
      draft.phoneNumber.trim() !== (profile.phoneNumber || '') ||
      draft.workLocation.trim() !== (profile.workLocation || '')
    dirty = contactChanged || removedLinks.length > 0 || addedSkills.length > 0
    if (!PHONE_RULE.test(draft.phoneNumber.trim())) {
      problem = 'Phone can have digits, +, -, spaces and brackets only (6 to 20 characters)'
    }
  }

  const setField = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))

  const addSkill = (id) => {
    const opt = activeSkills.find((o) => o.id === id)
    if (!opt) return
    setDraft((d) => ({
      ...d,
      skills: [...d.skills, { key: `s${id}`, id, linkId: null, name: opt.name, status: 'PENDING' }],
    }))
  }

  const addNewSkill = (name) => {
    const lower = name.toLowerCase()
    const existing = activeSkills.find((o) => o.name.toLowerCase() === lower)
    if (existing) {
      if (!draft.skills.some((s) => s.id === existing.id)) addSkill(existing.id)
      return
    }
    if (draft.skills.some((s) => s.name.toLowerCase() === lower)) return
    setDraft((d) => ({
      ...d,
      skills: [...d.skills, { key: `new:${lower}`, id: `new:${lower}`, linkId: null, name, status: 'PENDING' }],
    }))
  }

  const removeSkill = (id) => setDraft((d) => ({ ...d, skills: d.skills.filter((s) => s.id !== id) }))

  const saveDetails = async () => {
    if (problem) return
    setSaving(true)
    setSaveError('')
    setNotice(null)
    let failed = ''
    try {
      if (contactChanged) {
        await orgApi.updateMyProfile({
          phoneNumber: draft.phoneNumber.trim(),
          workLocation: draft.workLocation.trim(),
        })
      }
      for (const m of removedLinks) {
        await orgApi.removeMySkill(m.id)
      }
      for (const s of addedSkills) {
        await orgApi.requestSkill(typeof s.id === 'number' ? { skillId: s.id } : { name: s.name })
      }
      setNotice(
        addedSkills.length > 0 ? 'Saved. New skills are sent to the admin for review.' : 'Details saved.',
      )
    } catch (err) {
      failed = err.message || 'Could not save'
    }
    // always reload, so the page matches the server even when one step failed
    await loadProfile()
    if (failed) setSaveError(`${failed}. The page was reloaded from the server.`)
    setSaving(false)
  }

  return (
    <div>
      <PageHeader icon={UserCircle} title="My account" subtitle="Your details, password and skills." />

      {loading ? (
        <div className="flex items-center justify-center text-slate-500 text-sm py-10">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {notice && !dirty && <Alert type="success">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}

          {profile && draft && (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="h-fit bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-semibold text-slate-900 mb-2">Details</h2>
                <dl className="divide-y divide-slate-100 text-sm">
                  <Row label="Name"><Plain v={profile.fullName} /></Row>
                  <Row label="Email"><Plain v={profile.email} /></Row>
                  <Row label="Role"><Plain v={profile.role} /></Row>

                  {!isAdminUser && (
                    <>
                      <Row label="Department"><Plain v={profile.departmentName} /></Row>
                      <Row label="Designation"><Plain v={profile.designation} /></Row>
                      <Row label="Work location">
                        <EditableText
                          align="right"
                          value={draft.workLocation}
                          onChange={setField('workLocation')}
                          maxLength={100}
                        />
                      </Row>
                      <Row label="Phone">
                        <EditableText
                          align="right"
                          value={draft.phoneNumber}
                          onChange={setField('phoneNumber')}
                          maxLength={20}
                        />
                      </Row>
                      <Row label="Skills">
                        <SkillsEditor
                          selected={draft.skills.map((s) => ({
                            id: s.id,
                            name: s.name,
                            status: s.status,
                            reason: s.status === 'REJECTED' ? s.reason : undefined,
                          }))}
                          options={activeSkills.map((o) => ({ id: o.id, name: o.name }))}
                          onAdd={addSkill}
                          onRemove={removeSkill}
                          onAddNew={addNewSkill}
                        />
                      </Row>
                    </>
                  )}
                </dl>

                {!isAdminUser && (
                  <p className="mt-3 text-xs text-slate-500">
                    Department and designation are set by an admin. New skills are checked by an admin before they
                    count.
                  </p>
                )}
              </section>

              <section className="h-fit bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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
                      disabled={settingPassword}
                      className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm"
                    >
                      {settingPassword ? (
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
          )}

          <EditBar
            dirty={dirty}
            saving={saving}
            canSave={!problem}
            error={problem || saveError}
            onSave={saveDetails}
            onCancel={() => {
              setDraft(draftFrom(profile, mine))
              setSaveError('')
            }}
          />
        </>
      )}
    </div>
  )
}

export default AccountPage