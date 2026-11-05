import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import SelectMenu from '../../components/common/SelectMenu'
import { ITEM_KIND_OPTIONS } from '../utils/meta'
import { INPUT } from './bits'

/** Add or edit one item. initial: the item (edit) or nothing (add). onSave(body without categoryId). */
export default function ItemForm({ initial, busy, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    kind: initial?.kind || 'PHYSICAL',
    totalStock: initial?.totalStock ?? 10,
    maxPerRequest: initial?.maxPerRequest ?? 1,
    active: initial?.active ?? true,
  })
  const set = (key) => (value) => setF((p) => ({ ...p, [key]: value }))

  const physical = f.kind === 'PHYSICAL'
  const stock = parseInt(f.totalStock, 10)
  const max = parseInt(f.maxPerRequest, 10)
  const ok = f.name.trim() && max >= 1 && max <= 1000 && (!physical || (stock >= 0 && stock <= 100000))

  const submit = (e) => {
    e.preventDefault()
    if (!ok) return
    onSave({
      name: f.name.trim(),
      description: f.description.trim(),
      kind: f.kind,
      totalStock: physical ? stock : null,
      maxPerRequest: max,
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
            maxLength={150}
            value={f.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="e.g. Laptop 14 inch"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Kind</label>
          <SelectMenu value={f.kind} options={ITEM_KIND_OPTIONS} onChange={set('kind')} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
        <input
          maxLength={255}
          value={f.description}
          onChange={(e) => set('description')(e.target.value)}
          placeholder="One line shown on the request page"
          className={INPUT}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {physical && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Total stock</label>
            <input
              type="number"
              min={0}
              max={100000}
              value={f.totalStock}
              onChange={(e) => set('totalStock')(e.target.value)}
              className={INPUT}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Most per request</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={f.maxPerRequest}
            onChange={(e) => set('maxPerRequest')(e.target.value)}
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