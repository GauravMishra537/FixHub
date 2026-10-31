import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { infraApi } from '../../api/infra'

const BADGE = {
  PENDING: 'bg-violet-100 text-violet-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
}
const LABEL = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }

// "Mon, 2 Nov 2026, 10:00 am to 11:00 am"
function when(b) {
  const start = new Date(b.startTime)
  const end = new Date(b.endTime)
  const date = start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (b.allDay) return `${date}, all day`
  const time = (x) => x.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date}, ${time(start)} to ${time(end)}`
}

/**
 * The sessions of an infra ticket: unit, time, status, reasons.
 * Admin can cancel a session that has not ended, with a reason.
 * refreshKey: goes up when the ticket changed (approve, reject), so the list loads again.
 * onChanged(): called after an admin cancel so the ticket page reloads.
 */
export default function SessionsCard({ ticketId, refreshKey, isAdmin, onChanged }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null) // { id, note }
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setRows(await infraApi.sessions(ticketId))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load sessions')
    }
  }, [ticketId])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const canCancel = (b) =>
    isAdmin && (b.status === 'PENDING' || b.status === 'APPROVED') && new Date(b.endTime) > new Date()

  const cancel = async () => {
    setBusy(true)
    setError('')
    try {
      await infraApi.cancelSession(cancelling.id, cancelling.note.trim())
      setCancelling(null)
      await load()
      await onChanged?.(null)
    } catch (e) {
      setError(e.message || 'Could not cancel')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">
        Sessions{rows ? ` (${rows.length})` : ''}
      </h2>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!rows && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      )}

      {rows && rows.length === 0 && <p className="text-sm text-slate-400">No sessions.</p>}

      {rows && rows.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {rows.map((b) => (
            <li key={b.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {b.unitName}
                    <span className="ml-2 text-xs font-normal text-slate-500">{b.capacity} seats</span>
                  </div>
                  <div className="text-sm text-slate-600">{when(b)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {b.oversize && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Bigger than needed
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[b.status] || BADGE.CANCELLED}`}>
                    {LABEL[b.status] || b.status}
                  </span>
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-500">{b.headcount} people</div>
              {b.reason && <div className="mt-1 text-xs text-slate-500">Reason: {b.reason}</div>}
              {b.decisionNote && (
                <div className="mt-1 text-xs text-slate-500">Admin note: {b.decisionNote}</div>
              )}

              {canCancel(b) && cancelling?.id !== b.id && (
                <button
                  type="button"
                  onClick={() => setCancelling({ id: b.id, note: '' })}
                  className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                >
                  Cancel this session
                </button>
              )}

              {cancelling?.id === b.id && (
                <div className="mt-2 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Why is it cancelled?
                  </label>
                  <textarea
                    autoFocus
                    rows={2}
                    maxLength={500}
                    value={cancelling.note}
                    onChange={(e) => setCancelling({ ...cancelling, note: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || !cancelling.note.trim()}
                      onClick={cancel}
                      className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      Cancel session
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCancelling(null)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}