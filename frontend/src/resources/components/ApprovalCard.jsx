import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import { PriorityBadge } from '../../components/tickets/TicketStatusBadge'
import { formatDate } from '../../utils/format'

// left edge colour follows the priority, same as TicketCard
const EDGE = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-400',
  MEDIUM: 'border-l-blue-400',
  LOW: 'border-l-slate-300',
}

const day = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString() : '')

/**
 * One resource request waiting for me at the department step. row = ResourceApprovalDto.
 * Approve or Reject right here. Reject asks for a reason first.
 * onOpen(ticketId): the card was clicked. onDone(): a decision was saved, load the queue again.
 */
export default function ApprovalCard({ row, onOpen, onDone }) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const decide = async (action, text) => {
    setBusy(true)
    setError('')
    try {
      await ticketCoreApi.transition(row.ticketId, action, text, row.version)
      await onDone()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const open = () => onOpen?.(row.ticketId)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      className={`block w-full min-w-0 cursor-pointer rounded-lg border border-l-4 border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
        EDGE[row.priority] || 'border-l-slate-300'
      }`}
    >
      <div
        className="text-sm font-medium text-slate-900"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {row.title}
      </div>
      <div className="mt-1 text-xs font-medium text-blue-700">{row.ticketNo}</div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={row.priority} />
        <span className="inline-block whitespace-nowrap rounded-full border border-violet-300 bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
          Resource request
        </span>
      </div>

      {row.reason && (
        <div
          className="mt-2 text-xs text-slate-600"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {row.reason}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(row.createdOn)}</span>
        <span className="max-w-[140px] truncate text-slate-400">by {row.requesterName}</span>
      </div>
      {row.neededBy && <div className="mt-0.5 text-xs text-amber-700">Needed by {day(row.neededBy)}</div>}

      {/* buttons: a click here must not open the panel */}
      <div className="mt-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {error && (
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-red-600">
            <span>{error}</span>
            <button type="button" onClick={() => onDone()} className="shrink-0 font-semibold underline">
              Reload
            </button>
          </div>
        )}

        {!rejecting ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide('DEPT_APPROVE', '')}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejecting(true)}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Why is it rejected?
            </label>
            <textarea
              autoFocus
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !note.trim()}
                onClick={() => decide('DEPT_REJECT', note.trim())}
                className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setRejecting(false)
                  setNote('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}