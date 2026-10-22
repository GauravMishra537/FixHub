import React, { useEffect, useState } from 'react'
import { Tags, Plus, Trash2, Power, Pencil, Check, X, Loader2 } from 'lucide-react'
import { ticketApi, TICKET_TYPES } from '../../api/tickets'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'

const FIELD =
  'flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function CategoriesPage() {
  const [type, setType] = useState(TICKET_TYPES[0].key)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const load = async (t = type) => {
    setLoading(true)
    try {
      setItems(await ticketApi.adminCategories(t))
    } catch (e) {
      setError(e.message || 'Could not load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setError('')
    setEditingId(null)
    setName('')
    load(type)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const run = async (fn) => {
    setError('')
    try {
      await fn()
      await load()
      return true
    } catch (e) {
      setError(e.message || 'Action failed')
      return false
    }
  }

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const ok = await run(() => ticketApi.createCategory({ ticketType: type, name: name.trim() }))
    if (ok) setName('')
  }

  const saveRename = async (c) => {
    if (!editName.trim()) return
    const ok = await run(() =>
      ticketApi.updateCategory(c.id, { ticketType: c.ticketType, name: editName.trim(), active: c.active })
    )
    if (ok) setEditingId(null)
  }

  const toggle = (c) =>
    run(() => ticketApi.updateCategory(c.id, { ticketType: c.ticketType, name: c.name, active: !c.active }))

  const remove = (c) => {
    if (window.confirm(`Delete category "${c.name}"?`)) run(() => ticketApi.deleteCategory(c.id))
  }

  return (
    <div>
      <PageHeader
        icon={Tags}
        title="Ticket categories"
        subtitle="Categories users pick when they create a ticket. Each ticket type has its own list."
        actions={
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1">
            {TICKET_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  type === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        <form onSubmit={add} className="flex gap-2 mb-4">
          <input
            className={FIELD}
            placeholder={`New ${TICKET_TYPES.find((t) => t.key === type).label.toLowerCase()} category`}
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </form>

        {loading ? (
          <div className="flex items-center text-sm text-slate-500 py-4">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No categories yet for this type.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 gap-3">
                {editingId === c.id ? (
                  <input
                    autoFocus
                    className={FIELD}
                    value={editName}
                    maxLength={100}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(c)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <div className="flex items-center">
                    <span className={`text-sm ${c.active ? 'text-slate-800' : 'text-slate-400'}`}>{c.name}</span>
                    {!c.active && (
                      <span className="ml-2 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        inactive
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {editingId === c.id ? (
                    <>
                      <button
                        title="Save"
                        onClick={() => saveRename(c)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        title="Cancel"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        title="Rename"
                        onClick={() => {
                          setEditingId(c.id)
                          setEditName(c.name)
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        title={c.active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggle(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => remove(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Inactive categories are hidden from users. A category already used by tickets cannot be deleted, deactivate it.
        </p>
      </section>
    </div>
  )
}

export default CategoriesPage