import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { orgApi } from '../../api/org'
import Alert from '../common/Alert'
import SkillStatusBadge from '../common/SkillStatusBadge'
import { EditableSelect, EditableText } from '../common/Editable'
import SkillsEditor from '../common/SkillsEditor'
import EditBar from '../common/EditBar'

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 max-w-[65%] text-right font-medium text-slate-900">{children}</dd>
    </div>
  )
}

const NotSet = ({ v }) => (v ? <span className="px-2">{v}</span> : <span className="px-2 text-slate-400">Not set</span>)

const fromProfile = (p) => ({
  departmentId: p.departmentId ?? '',
  designation: p.designation ?? '',
  skillIds: p.skills.filter((s) => s.status === 'APPROVED').map((s) => s.skillId),
})

export default function UserDetails({ userId, onSaved }) {
  const [profile, setProfile] = useState(null)
  const [departments, setDepartments] = useState([])
  const [skills, setSkills] = useState([])
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const [p, d, s] = await Promise.all([orgApi.getProfile(userId), orgApi.departments(), orgApi.adminSkills()])
      setProfile(p)
      setDepartments(d)
      setSkills(s)
      setDraft(fromProfile(p))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    setNotice('')
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }
  if (!profile || !draft) return <Alert>{error || 'User not found'}</Alert>

  const orig = fromProfile(profile)
  const sameSkills =
    orig.skillIds.length === draft.skillIds.length && orig.skillIds.every((id) => draft.skillIds.includes(id))
  const dirty =
    String(orig.departmentId) !== String(draft.departmentId) ||
    orig.designation.trim() !== draft.designation.trim() ||
    !sameSkills
  const canSave = !!draft.departmentId && draft.designation.trim().length > 0

  const skillName = (id) =>
    skills.find((s) => s.id === id)?.name || profile.skills.find((s) => s.skillId === id)?.skillName || `#${id}`

  const others = profile.skills.filter((s) => s.status !== 'APPROVED')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await orgApi.updateProfile(userId, {
        departmentId: draft.departmentId,
        designation: draft.designation.trim(),
        skillIds: draft.skillIds,
      })
      const removed = orig.skillIds.filter((id) => !draft.skillIds.includes(id))
      for (const id of removed) {
        const us = profile.skills.find((s) => s.skillId === id && s.status === 'APPROVED')
        if (us) await orgApi.removeUserSkill(userId, us.id)
      }
      setNotice('Details saved')
      await load()
      onSaved?.()
    } catch (e) {
      setError(e.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {notice && !dirty && <Alert type="success">{notice}</Alert>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <Row label="Name"><NotSet v={profile.fullName} /></Row>
          <Row label="Email"><NotSet v={profile.email} /></Row>
          <Row label="Department">
            <EditableSelect
              align="right"
              value={draft.departmentId}
              onChange={(v) => setDraft((d) => ({ ...d, departmentId: v }))}
              options={departments
                .filter((x) => x.active || x.id === profile.departmentId)
                .map((x) => ({ value: x.id, label: x.name }))}
            />
          </Row>
          <Row label="Designation">
            <EditableText
              align="right"
              value={draft.designation}
              onChange={(v) => setDraft((d) => ({ ...d, designation: v }))}
            />
          </Row>
          <Row label="Skills">
            <SkillsEditor
              selected={draft.skillIds.map((id) => ({ id, name: skillName(id) }))}
              options={skills.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
              onAdd={(id) => setDraft((d) => ({ ...d, skillIds: [...d.skillIds, id] }))}
              onRemove={(id) => setDraft((d) => ({ ...d, skillIds: d.skillIds.filter((x) => x !== id) }))}
            />
          </Row>
          <Row label="Work location"><NotSet v={profile.workLocation} /></Row>
          <Row label="Phone"><NotSet v={profile.phoneNumber} /></Row>
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

      <EditBar
        dirty={dirty}
        saving={saving}
        canSave={canSave}
        error={error}
        onSave={save}
        onCancel={() => {
          setDraft(fromProfile(profile))
          setError('')
        }}
      />
    </div>
  )
}