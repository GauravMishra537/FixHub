import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import SelectMenu from '../../components/common/SelectMenu'
import { RESOURCE_ICON_OPTIONS } from '../utils/meta'
import { INPUT } from './bits'

/**
 * Add or edit a group (isGroup) or a sub-category.
 * initial: the category (edit) or nothing (add). parentId: the group, for a new sub-category.
 * departments: [{ id, name }]. onSave(body).
 */
export default function CategoryForm({ initial, isGroup, parentId, departments, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    icon: initial?.icon || '',
    departmentId: initial?.departmentId ?? '',
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active ?? true,
  })
  const set = (key) => (value) => setF((p) => ({ ...p, [key]: value }))

  const departmentOptions = [
    { value: '', label: isGroup ? 'Admin only (no department)' : 'Same as the group' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ]

  const submit = (e) => {
    e.preventDefault()
    onSave({
      name: f.name.trim(),
      parentId: isGroup ? null : (initial?.parentId ?? parentId),
      icon: isGroup ? f.icon || null : null,
      sortOrder: Number(f.sortOrder) || 0,
      active: f.active,
      departmentId: f.departmentId === '' ? null : Number(f.departmentId),
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
            placeholder={isGroup ? 'e.g. IT Hardware' : 'e.g. Laptops and Computers'}
            className={INPUT}
          />
        </div>
        {isGroup && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Icon</label>
            <SelectMenu value={f.icon} options={RESOURCE_ICON_OPTIONS} onChange={set('icon')} />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Department that approves</label>
          <SelectMenu value={f.departmentId} options={departmentOptions} onChange={set('departmentId')} />
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
        Show on the request page
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