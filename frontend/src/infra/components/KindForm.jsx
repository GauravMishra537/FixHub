import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import SelectMenu from '../../components/common/SelectMenu'
import { ICON_OPTIONS } from '../utils/icons'
import { fmtDuration } from '../utils/time'

const LIMITS = [30, 60, 90, 120, 180, 240, 300, 360, 480, 720, 1440]

const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none'

/** Add or edit a kind. initial: the kind (edit) or nothing (add). onSave(body). */
export default function KindForm({ initial, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    icon: initial?.icon || '',
    maxMinutes: initial?.maxMinutes ?? 240,
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  })
  const set = (key) => (value) => setF((p) => ({ ...p, [key]: value }))

  // keep the current value in the list even when it is not one of the usual ones
  const limitOptions = [...new Set([...LIMITS, Number(f.maxMinutes)])]
    .sort((a, b) => a - b)
    .map((m) => ({ value: m, label: fmtDuration(m) }))

  const submit = (e) => {
    e.preventDefault()
    onSave({
      name: f.name.trim(),
      description: f.description.trim(),
      icon: f.icon,
      maxMinutes: Number(f.maxMinutes),
      sortOrder: Number(f.sortOrder) || 0,
      active: f.active,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
          <input
            autoFocus
            maxLength={100}
            value={f.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="e.g. Conference Room"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Icon</label>
          <SelectMenu value={f.icon} options={ICON_OPTIONS} onChange={set('icon')} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
        <input
          maxLength={255}
          value={f.description}
          onChange={(e) => set('description')(e.target.value)}
          placeholder="One line shown on the card"
          className={INPUT}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Longest session without a reason</label>
          <SelectMenu value={f.maxMinutes} options={limitOptions} onChange={set('maxMinutes')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Order on the page</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={f.sortOrder}
            onChange={(e) => set('sortOrder')(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={f.active}
          onChange={(e) => set('active')(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
        />
        Show on the booking page
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || f.name.trim().length < 1}
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