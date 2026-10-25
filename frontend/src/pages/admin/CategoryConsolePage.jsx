import React, { useCallback, useEffect, useState } from 'react'
import { GitMerge, Loader2, Pencil } from 'lucide-react'
import { categoryConsoleApi } from '../../api/categories'
import SelectMenu from '../../components/common/SelectMenu'

const TYPE_OPTIONS = [
  { value: 'ISSUE', label: 'Issues' },
  { value: 'ROOM_BOOKING', label: 'Room bookings' },
  { value: 'RESOURCE_REQUEST', label: 'Resource requests' },
  { value: 'TOPIC_REQUEST', label: 'Topic requests' },
]

function Row({ category, siblings, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [merging, setMerging] = useState(false)
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    onError('')
    try {
      await fn()
      setEditing(false)
      setMerging(false)
      setTarget('')
      await onChanged()
    } catch (e) {
      onError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const targets = siblings
    .filter((c) => c.id !== category.id && c.active)
    .map((c) => ({ value: c.id, label: `${c.name} (${c.ticketCount})` }))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') run(() => categoryConsoleApi.rename(category.id, name))
                  if (e.key === 'Escape') {
                    setName(category.name)
                    setEditing(false)
                  }
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={busy || name.trim().length < 2}
                onClick={() => run(() => categoryConsoleApi.rename(category.id, name))}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(category.name)
                  setEditing(false)
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`font-medium ${category.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                {category.name}
              </span>
              {!category.active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Disabled</span>
              )}
            </div>
          )}
          <div className="mt-0.5 text-xs text-slate-400">{category.ticketCount} ticket(s)</div>
        </div>

        {!editing && !merging && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Rename
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => categoryConsoleApi.setActive(category.id, !category.active))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
            >
              {category.active ? 'Disable' : 'Enable'}
            </button>
            <button
              type="button"
              disabled={targets.length === 0}
              onClick={() => setMerging(true)}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
            >
              <GitMerge className="mr-1 h-3.5 w-3.5" /> Merge
            </button>
          </div>
        )}
      </div>

      {merging && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-xs text-slate-500">
            All {category.ticketCount} ticket(s) and routing rules of "{category.name}" move into the category below.
            "{category.name}" is then removed.
          </p>
          <div className="flex gap-2">
            <SelectMenu
              className="min-w-0 flex-1"
              value={target}
              placeholder="Merge into..."
              options={targets}
              onChange={setTarget}
            />
            <button
              type="button"
              disabled={busy || !target}
              onClick={() => run(() => categoryConsoleApi.merge(category.id, target))}
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Merge
            </button>
            <button
              type="button"
              onClick={() => {
                setMerging(false)
                setTarget('')
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CategoryConsolePage() {
  const [type, setType] = useState('ISSUE')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems((await categoryConsoleApi.list(type)) || [])
    } catch (e) {
      setError(e.message || 'Could not load categories')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    setLoading(true)
    setError('')
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
      <p className="mt-1 text-sm text-slate-500">
        Rename, disable or merge categories. Disabled ones are hidden from suggestions but stay on old tickets.
      </p>

      <div className="mt-4 w-64">
        <SelectMenu value={type} options={TYPE_OPTIONS} onChange={setType} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="py-10 text-center text-slate-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-slate-400">No categories yet. They appear when tickets are raised.</p>
        ) : (
          items.map((c) => (
            <Row key={c.id} category={c} siblings={items} onChanged={load} onError={setError} />
          ))
        )}
      </div>
    </div>
  )
}