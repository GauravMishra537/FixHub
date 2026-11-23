import React, { useState } from 'react'
import { HandHelping, Loader2 } from 'lucide-react'
import { PriorityBadge } from '../../components/tickets/TicketStatusBadge'
import { formatDateTime } from '../../utils/format'

/**
 * One question the user can help with. Click the card to read it, or press "I can help" to take it.
 * onClaim(ticketId): claims it. Throws the server message when someone else was first.
 */
export default function TopicQueueCard({ row, onOpen, onClaim }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const help = async (e) => {
    e.stopPropagation()
    setBusy(true)
    setError('')
    try {
      await onClaim(row.ticketId)
    } catch (err) {
      setError(err.message || 'Could not take it')
      setBusy(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row.ticketId)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(row.ticketId)}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-400"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900" title={row.title}>
            {row.title}
          </div>
          <div className="text-xs text-blue-700">{row.ticketNo}</div>
        </div>
        <PriorityBadge priority={row.priority} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {row.topics.map((t) => (
          <span key={t} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="truncate">
          by {row.authorName} · {formatDateTime(row.createdOn)}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={help}
          className="inline-flex shrink-0 items-center rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <HandHelping className="mr-1 h-3.5 w-3.5" />}
          I can help
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}