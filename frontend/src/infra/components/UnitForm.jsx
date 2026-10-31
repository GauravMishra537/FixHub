import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'

const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none'

/** Add or edit one unit. initial: the unit (edit) or nothing (add). onSave({ name, capacity, location, note }). */
export default function UnitForm({ initial, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    capacity: initial?.capacity ?? '',
    location: initial?.location || '',
    note: initial?.note || '',
  })
  const set = (key) => (e) => setF((p) => ({ ...p, [key]: e.target.value }))
  const capacity = parseInt(f.capacity, 10)
  const ok = f.name.trim() && capacity >= 1 && capacity <= 1000

  const submit = (e) => {
    e.preventDefault()
    if (!ok) return
    onSave({ name: f.name.trim(), capacity, location: f.location.trim(), note: f.note.trim() })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
          <input autoFocus maxLength={100} value={f.name} onChange={set('name')} placeholder="e.g. Conference Room 6" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Seats</label>
          <input type="number" min={1} max={1000} value={f.capacity} onChange={set('capacity')} className={INPUT} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Location</label>
          <input maxLength={100} value={f.location} onChange={set('location')} placeholder="e.g. Floor 2" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Note</label>
          <input maxLength={255} value={f.note} onChange={set('note')} placeholder="Projector, whiteboard..." className={INPUT} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !ok}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}