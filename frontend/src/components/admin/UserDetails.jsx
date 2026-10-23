import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { orgApi } from '../../api/org'
import Alert from '../common/Alert'
import SkillStatusBadge from '../common/SkillStatusBadge'
import ProfileForm from './ProfileForm'

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">
        {value || <span className="text-slate-400">Not set</span>}
      </dd>
    </div>
  )
}

/**
 * Shows one user and lets the admin set department, designation and skills.
 * Saving only sets values and adds approved skills. Nothing is removed or blanked.
 * onSaved() is called after a successful save.
 */
export default function UserDetails({ userId, onSaved }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [version, setVersion] = useState(0)

  const load = useCallback(async () => {
    try {
      setProfile(await orgApi.getProfile(userId))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const save = async (body) => {
    await orgApi.updateProfile(userId, body)
    setNotice('Details saved')
    await load()
    setVersion((v) => v + 1)
    onSaved?.()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }

  if (!profile) return <Alert>{error || 'User not found'}</Alert>

  const approvedIds = profile.skills.filter((s) => s.status === 'APPROVED').map((s) => s.skillId)
  const others = profile.skills.filter((s) => s.status !== 'APPROVED')

  return (
    <div className="space-y-5">
      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <Row label="Name" value={profile.fullName} />
          <Row label="Email" value={profile.email} />
          <Row label="Department" value={profile.departmentName} />
          <Row label="Designation" value={profile.designation} />
          <Row label="Work location" value={profile.workLocation} />
          <Row label="Phone" value={profile.phoneNumber} />
        </dl>

        {others.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Other skill requests:{' '}
            {others.map((s) => (
              <span key={s.id} className="mr-2 inline-flex items-center gap-1">
                {s.skillName} <SkillStatusBadge status={s.status} />
              </span>
            ))}
            <div className="mt-1">Review them in Skill review.</div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Set details</h3>
        <ProfileForm
          key={version}
          initial={{
            departmentId: profile.departmentId,
            designation: profile.designation,
            skillIds: approvedIds,
          }}
          lockedSkillIds={approvedIds}
          submitLabel="Save details"
          onSubmit={save}
        />
      </section>
    </div>
  )
}