import React, { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { orgApi } from '../../api/org'
import Alert from '../common/Alert'

const FIELD =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

/**
 * Admin sets department, designation, skills.
 * initial: { departmentId, designation, skillIds }
 * lockedSkillIds: skills the user already has (ticked, cannot untick here)
 */
export default function ProfileForm({ initial = {}, lockedSkillIds = [], submitLabel, onSubmit, onCancel }) {
  const [departments, setDepartments] = useState([])
  const [skills, setSkills] = useState([])
  const [departmentId, setDepartmentId] = useState(initial.departmentId ?? '')
  const [designation, setDesignation] = useState(initial.designation ?? '')
  const [skillIds, setSkillIds] = useState(initial.skillIds ?? [])
  const [newSkill, setNewSkill] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([orgApi.departments(), orgApi.skills ? orgApi.skills() : orgApi.activeSkills()])
      .then(([d, s]) => {
        setDepartments(d.filter((x) => x.active))
        setSkills(s)
      })
      .catch((e) => setError(e.message || 'Could not load lists'))
  }, [])

  const toggleSkill = (id) => setSkillIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const addNewSkill = async () => {
    if (!newSkill.trim()) return
    setError('')
    try {
      const created = await orgApi.createSkill(newSkill.trim())
      setSkills((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSkillIds((ids) => [...ids, created.id])
      setNewSkill('')
    } catch (e) {
      setError(e.message || 'Could not add skill')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        departmentId: departmentId ? Number(departmentId) : null,
        designation: designation.trim() || null,
        skillIds,
      })
    } catch (err) {
      setError(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
        <select className={FIELD} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
        <input
          className={FIELD}
          value={designation}
          maxLength={100}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Software engineer"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Skills</label>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => {
            const locked = lockedSkillIds.includes(s.id)
            const on = locked || skillIds.includes(s.id)
            return (
              <label
                key={s.id}
                className={`inline-flex items-center cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${
                  on ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
                } ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={locked}
                  onChange={() => toggleSkill(s.id)}
                />
                {s.name}
              </label>
            )
          })}
          {skills.length === 0 && <span className="text-xs text-slate-400">No skills yet. Add one below.</span>}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            className={FIELD}
            placeholder="Add a new skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button
            type="button"
            onClick={addNewSkill}
            className="inline-flex items-center px-3 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold shadow-sm"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}