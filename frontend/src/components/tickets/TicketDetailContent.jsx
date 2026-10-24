import React, { useCallback, useEffect, useState } from 'react'
import { Globe, Lock } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import Alert from '../common/Alert'
import EditBar from '../common/EditBar'
import { EditableSelect, EditableText } from '../common/Editable'
import CategoryCombobox from './CategoryCombobox'
import TicketStatusBadge, { PriorityBadge } from './TicketStatusBadge'
import TicketTimeline from './TicketTimeline'
import { formatDateTime } from '../../utils/format'
import { PRIORITY_OPTIONS, VISIBILITY_OPTIONS } from '../../utils/options'

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  )
}

// click the text, it turns into the typing box with suggestions
function CategoryField({ value, onChange, type, editable }) {
  const [editing, setEditing] = useState(false)

  if (!editable) return <span className="block px-2">{value || '-'}</span>

  if (editing) {
    return <CategoryCombobox autoFocus value={value} onChange={onChange} type={type} onDone={() => setEditing(false)} />
  }

  return (
    <button
      type="button"
      title="Click to change"
      onClick={() => setEditing(true)}
      className="block w-full cursor-text rounded-lg px-2 py-1 text-left text-slate-900 hover:bg-slate-100"
    >
      {value || <span className="text-slate-400">Not set</span>}
    </button>
  )
}

const fromTicket = (t) => ({
  title: t.title,
  description: t.description || '',
  categoryName: t.categoryName || '',
  priority: t.priority,
  visibility: t.visibility,
})

const normalize = (d) => ({
  ...d,
  title: d.title.trim(),
  description: d.description.trim(),
  categoryName: d.categoryName.trim(),
})

/**
 * Everything about one ticket: view, edit, details and activity.
 * layout "page":  two columns, for the full details page.
 * layout "panel": one column, for the right-side panel.
 * onChanged(ticket): called after a successful save so a board behind the panel can refresh.
 */
export default function TicketDetailContent({ ticketId, layout = 'page', onChanged }) {
  const [ticket, setTicket] = useState(null)
  const [draft, setDraft] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [t, h] = await Promise.all([ticketCoreApi.get(ticketId), ticketCoreApi.history(ticketId)])
      setTicket(t)
      setDraft(fromTicket(t))
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

  if (loading && !ticket) return <p className="py-10 text-center text-slate-400">Loading...</p>

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
    )
  }

  if (!ticket || !draft) return null

    const canEdit = ticket.canEdit // title, description, visibility: only the person who raised it
  const canTriage = Boolean(ticket.canEdit || ticket.canTriage) // category and priority: also the admin
  const original = fromTicket(ticket)
  const dirty = JSON.stringify(normalize(draft)) !== JSON.stringify(normalize(original))
  const problem = !draft.title.trim()
    ? 'Title is required'
    : draft.categoryName.trim().length < 2
    ? 'Category is required (at least 2 characters)'
    : ''
  const panel = layout === 'panel'

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))

  const reload = async () => {
    setSaveError('')
    setNotice('')
    await load()
  }

  const save = async () => {
    if (problem) return
    setSaveError('')
    setSaving(true)
    try {
      const updated = await ticketCoreApi.update(ticketId, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        categoryName: draft.categoryName.trim(),
        priority: draft.priority,
        visibility: draft.visibility,
        version: ticket.version,
      })
      setTicket(updated)
      setDraft(fromTicket(updated))
      setHistory((await ticketCoreApi.history(ticketId)) || [])
      setNotice('Ticket updated')
      onChanged?.(updated)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const main = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-blue-700">{ticket.ticketNo}</div>

      {saveError && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{saveError}</span>
          <button type="button" onClick={reload} className="shrink-0 font-semibold underline">
            Reload
          </button>
        </div>
      )}
      {notice && !dirty && <Alert type="success">{notice}</Alert>}

      <div className="-ml-2">
        <EditableText
          value={draft.title}
          onChange={set('title')}
          editable={canEdit}
          maxLength={200}
          textClass="text-xl font-bold"
          placeholder="Add a title"
        />
      </div>

      <div className="-ml-2 mt-3">
        <EditableText
          multiline
          rows={5}
          value={draft.description}
          onChange={set('description')}
          editable={canEdit}
          maxLength={5000}
          textClass="text-sm"
          placeholder={canEdit ? 'Click to add a description' : 'No description given.'}
        />
      </div>
      {canTriage && !dirty && (
        <p className="mt-3 text-xs text-slate-400">
          {canEdit ? 'Click any field to edit it.' : 'As admin you can change the category and the priority.'}
        </p>
      )}

    </div>
  )

  const details = (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Details</h2>
      <div className={panel ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <Field label="Status">
          <TicketStatusBadge status={ticket.status} />
        </Field>

        <Field label="Priority">
          <div className="-ml-2">
            <EditableSelect
              value={draft.priority}
              onChange={set('priority')}
              options={PRIORITY_OPTIONS}
              editable={canTriage}
              renderValue={() => <PriorityBadge priority={draft.priority} />}
            />
          </div>
        </Field>

        <Field label="Visibility">
          <div className="-ml-2">
            <EditableSelect
              value={draft.visibility}
              onChange={set('visibility')}
              options={VISIBILITY_OPTIONS}
              editable={canEdit}
              renderValue={(label) => (
                <span className="inline-flex items-center text-sm text-slate-800">
                  {draft.visibility === 'PRIVATE' ? (
                    <Lock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <Globe className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  )}
                  {label}
                </span>
              )}
            />
          </div>
        </Field>

        <Field label="Category">
          <div className="-ml-2">
            <CategoryField
              value={draft.categoryName}
              onChange={set('categoryName')}
              type={ticket.type}
              editable={canTriage}
            />
          </div>
        </Field>

        <Field label="Author">{ticket.authorName}</Field>
        <Field label="Assigned to">{ticket.assigneeName || 'Not assigned yet'}</Field>
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

  const body = panel ? (
    <div className="space-y-4">
      {main}
      {details}
      {activity}
    </div>
  ) : (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {main}
        {activity}
      </div>
      {details}
    </div>
  )

  return (
    <div>
      {body}
      <EditBar
        dirty={dirty}
        saving={saving}
        canSave={!problem}
        error={problem}
        onSave={save}
        onCancel={() => {
          setDraft(original)
          setSaveError('')
        }}
      />
    </div>
  )
}