import React, { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, UserCheck, X } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import { getUsers } from '../../api/admin'
import SelectMenu from '../common/SelectMenu'
import { formatDateTime } from '../../utils/format'

/** Admin box: waiting claims (approve or reject), assign to a person, take the ticket back. */
export default function TicketAssignPanel({ ticket, refreshKey, onDone }) {
  const ticketId = ticket.id
  const [claims, setClaims] = useState([])
  const [users, setUsers] = useState([])
  const [pick, setPick] = useState('')
  const [rejecting, setRejecting] = useState(null) // { id, reason }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [c, u] = await Promise.all([ticketCoreApi.claims(ticketId), getUsers()])
      setClaims(c || [])
      setUsers(u || [])
    } catch (e) {
      setError(e.message || 'Could not load claims')
    }
  }, [ticketId])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      const updated = await fn()
      setPick('')
      setRejecting(null)
      await onDone(updated)
      await load()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const waiting = claims.filter((c) => c.status === 'PENDING')
  const options = users
    .filter((u) => u.role !== 'ADMIN')
    .map((u) => ({
      value: u.id,
      label: `${u.fullName} (${u.email})${u.departmentName ? ` - ${u.departmentName}` : ''}`,
    }))

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center text-sm font-semibold text-slate-900">
        <UserCheck className="mr-2 h-4 w-4 text-slate-500" /> Assignment
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {waiting.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waiting claims</div>
          {waiting.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{c.userName}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(c.createdOn)}</div>
                </div>
                {rejecting?.id !== c.id && (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => ticketCoreApi.approveClaim(ticketId, c.id))}
                      className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRejecting({ id: c.id, reason: '' })}
                      className="inline-flex items-center rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {rejecting?.id === c.id && (
                <div className="mt-2 space-y-2">
                  <input
                    autoFocus
                    maxLength={255}
                    value={rejecting.reason}
                    onChange={(e) => setRejecting({ id: c.id, reason: e.target.value })}
                    placeholder="Why is it rejected?"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || !rejecting.reason.trim()}
                      onClick={() => run(() => ticketCoreApi.rejectClaim(ticketId, c.id, rejecting.reason.trim()))}
                      className="inline-flex items-center rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRejecting(null)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {ticket.assigneeName ? `Assigned to ${ticket.assigneeName}. Give it to someone else` : 'Assign to a person'}
        </div>
        <div className="flex gap-2">
          <SelectMenu
            className="min-w-0 flex-1"
            value={pick}
            placeholder="Select a person"
            options={options}
            onChange={setPick}
          />
          <button
            type="button"
            disabled={busy || !pick}
            onClick={() => run(() => ticketCoreApi.assign(ticketId, pick))}
            className="inline-flex shrink-0 items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Assign
          </button>
        </div>

        {ticket.assigneeName && ticket.status === 'ASSIGNED' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => window.confirm('Take the ticket back?') && run(() => ticketCoreApi.unassign(ticketId))}
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
          >
            Take back (unassign)
          </button>
        )}
      </div>
    </div>
  )
}