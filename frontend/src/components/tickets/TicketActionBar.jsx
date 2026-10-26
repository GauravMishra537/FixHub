import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'

const STYLE = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400',
  danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
}

const KIND = {
  START: 'primary',
  RESUME: 'primary',
  RESOLVE: 'success',
  CONFIRM: 'success',
  HOLD: 'outline',
  REOPEN: 'danger',
  CANCEL: 'danger',
}

// question above the reason box
const ASK = {
  HOLD: 'Why is it on hold?',
  RESOLVE: 'What was done to fix it?',
  REOPEN: 'Why is it not fixed?',
}

/**
 * Buttons the server says this person may press now (ticket.actions).
 * A button that needs a reason opens a small box first.
 * onDone(updatedTicket): called after a successful move. onDone(null) after Reload.
 */
export default function TicketActionBar({ ticket, onDone }) {
  const actions = ticket.actions || []
  const [asking, setAsking] = useState(null) // { action, label, note }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (actions.length === 0) return null

  const waitingForConfirm = actions.some((a) => a.action === 'CONFIRM')

  const run = async (action, note) => {
    setBusy(true)
    setError('')
    try {
      const updated = await ticketCoreApi.transition(ticket.id, action, note, ticket.version)
      setAsking(null)
      await onDone(updated)
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const press = (a) => {
    if (a.noteRequired) {
      setAsking({ action: a.action, label: a.label, note: '' })
      return
    }
    if (a.action === 'CANCEL' && !window.confirm('Cancel this ticket?')) return
    run(a.action, '')
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">
        {waitingForConfirm ? 'Marked resolved. Is it fixed?' : 'Next step'}
      </div>

      {error && (
        <div className="mt-2 flex items-center justify-between gap-3 text-sm text-red-600">
          <span>{error}</span>
          <button type="button" onClick={() => onDone(null)} className="shrink-0 font-semibold underline">
            Reload
          </button>
        </div>
      )}

      {!asking && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.action}
              type="button"
              disabled={busy}
              onClick={() => press(a)}
              className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                STYLE[KIND[a.action] || 'outline']
              }`}
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {asking && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {ASK[asking.action] || 'Reason'}
          </label>
          <textarea
            autoFocus
            rows={3}
            maxLength={500}
            value={asking.note}
            onChange={(e) => setAsking({ ...asking, note: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !asking.note.trim()}
              onClick={() => run(asking.action, asking.note.trim())}
              className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                STYLE[KIND[asking.action] || 'outline']
              }`}
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {asking.label}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAsking(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}