import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import SelectMenu from '../../components/common/SelectMenu'
import { resourcesApi } from '../../api/resources'

// one department: who approves its requests. only its own members can be picked
function ApproverRow({ row, onChanged }) {
  const [members, setMembers] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    resourcesApi
      .members(row.departmentId)
      .then((m) => live && setMembers(m || []))
      .catch((e) => live && setError(e.message || 'Could not load members'))
    return () => {
      live = false
    }
  }, [row.departmentId])

  const options = [
    { value: '', label: 'No approver (admin decides)' },
    ...(members || []).map((m) => ({
      value: m.id,
      label: m.designation ? `${m.fullName} - ${m.designation}` : m.fullName,
    })),
  ]

  const change = async (value) => {
    setBusy(true)
    setError('')
    try {
      if (value === '') await resourcesApi.clearApprover(row.departmentId)
      else await resourcesApi.setApprover(row.departmentId, Number(value))
      await onChanged()
    } catch (e) {
      setError(e.message || 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-2">
      <div className="min-w-0">
        <div className="font-medium text-slate-900">{row.departmentName}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {row.owns?.length ? `Owns: ${row.owns.join(', ')}` : 'Owns no category yet'}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <SelectMenu
            className="flex-1"
            value={row.userId ?? ''}
            options={options}
            disabled={busy || !members}
            placeholder="Loading..."
            onChange={change}
          />
          {(busy || !members) && !error && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    </li>
  )
}

/** Admin: one person per department who does the first approval. rows from GET /approvers. */
export default function ApproversPanel({ rows, onChanged }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Approvers</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Only this person is told about a request for the department. With no approver, or when the requester is the
          approver, the request goes straight to admin.
        </p>
      </div>
      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {rows.length === 0 && <li className="py-10 text-center text-sm text-slate-400">No departments yet.</li>}
        {rows.map((r) => (
          <ApproverRow key={r.departmentId} row={r} onChanged={onChanged} />
        ))}
      </ul>
    </section>
  )
}