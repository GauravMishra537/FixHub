import React, { useCallback, useEffect, useState } from 'react'
import { Lock, Globe, Pencil } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import CategoryCombobox from './CategoryCombobox'
import TicketStatusBadge, { PriorityBadge } from './TicketStatusBadge'
import TicketTimeline from './TicketTimeline'
import { formatDateTime } from '../../utils/format'

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  )
}

/**
 * Everything about one ticket: view, edit, details and activity.
 * layout "page":  two columns, for the full details page.
 * layout "panel": one column, for the right-side panel.
 * onChanged(ticket): called after a successful save so a board behind the panel can refresh.
 */
export default function TicketDetailContent({ ticketId, layout = 'page', onChanged }) {
  const [ticket, setTicket] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [t, h] = await Promise.all([ticketCoreApi.get(ticketId), ticketCoreApi.history(ticketId)])
      setTicket(t)
      setHistory(h || [])
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = () => {
    setForm({
      title: ticket.title,
      description: ticket.description || '',
      categoryName: ticket.categoryName || '',
      priority: ticket.priority,
      isPrivate: ticket.visibility === 'PRIVATE',
    })
    setSaveError('')
    setNotice('')
    setEditing(true)
  }

  const reload = async () => {
    setEditing(false)
    setSaveError('')
    await load()
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    if (!form.title.trim()) return setSaveError('Title is required')
    if (form.categoryName.trim().length < 2) return setSaveError('Category is required (at least 2 characters)')

    setSaving(true)
    try {
      const updated = await ticketCoreApi.update(ticketId, {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryName: form.categoryName.trim(),
        priority: form.priority,
        visibility: form.isPrivate ? 'PRIVATE' : 'PUBLIC',
        version: ticket.version,
      })
      setTicket(updated)
      setHistory((await ticketCoreApi.history(ticketId)) || [])
      setEditing(false)
      setNotice('Ticket updated')
      onChanged?.(updated)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !ticket) return <p className="py-10 text-center text-slate-400">Loading...</p>

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
    )
  }

  const isPrivate = ticket.visibility === 'PRIVATE'
  const panel = layout === 'panel'

  const main = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-blue-700">{ticket.ticketNo}</span>
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <span className="inline-flex items-center text-xs text-slate-500">
          {isPrivate ? <Lock className="mr-1 h-3 w-3" /> : <Globe className="mr-1 h-3 w-3" />}
          {isPrivate ? 'Private' : 'Public'}
        </span>
      </div>

      {notice && (
        <div className="my-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      )}

      {!editing && (
        <>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
            {ticket.canEdit && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex shrink-0 items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
            {ticket.description || <span className="text-slate-400">No description given.</span>}
          </p>
        </>
      )}

      {editing && form && (
        <form onSubmit={save} className="mt-3 space-y-4">
          {saveError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{saveError}</span>
              <button type="button" onClick={reload} className="shrink-0 font-semibold underline">
                Reload
              </button>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              value={form.title}
              maxLength={200}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <CategoryCombobox
              value={form.categoryName}
              onChange={(v) => setForm({ ...form, categoryName: v })}
              type={ticket.type}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={5}
              value={form.description}
              maxLength={5000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
            />
            Private (only me, the assignee and admin can see it)
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )

  const details = (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Details</h2>
      <div className={panel ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <Field label="Author">{ticket.authorName}</Field>
        <Field label="Assigned to">{ticket.assigneeName || 'Not assigned yet'}</Field>
        <Field label="Category">{ticket.categoryName || '-'}</Field>
        <Field label="Department">{ticket.departmentName || 'Not routed yet'}</Field>
        <Field label="Created">{formatDateTime(ticket.createdOn)}</Field>
        <Field label="Last updated">{formatDateTime(ticket.updatedOn)}</Field>
        {ticket.resolvedOn && <Field label="Resolved">{formatDateTime(ticket.resolvedOn)}</Field>}
        {ticket.reopenCount > 0 && <Field label="Reopened">{ticket.reopenCount} time(s)</Field>}
      </div>
    </aside>
  )

  const activity = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Activity</h2>
      <TicketTimeline items={history} />
    </div>
  )

  if (panel) {
    return (
      <div className="space-y-4">
        {main}
        {details}
        {activity}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {main}
        {activity}
      </div>
      {details}
    </div>
  )
}