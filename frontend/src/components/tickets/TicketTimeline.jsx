import React from 'react'
import { formatDateTime } from '../../utils/format'

const short = (v) => {
  if (v === null || v === undefined || v === '') return 'empty'
  const s = String(v)
  return s.length > 60 ? `${s.slice(0, 60)}...` : s
}

function describe(h) {
  switch (h.action) {
    case 'CREATED':
      return 'raised this ticket'
    case 'UPDATED':
      return `changed ${h.fieldName} from "${short(h.fromValue)}" to "${short(h.toValue)}"`
    case 'STATUS_CHANGED':
      return `changed status from ${short(h.fromValue)} to ${short(h.toValue)}`
    case 'ASSIGNED':
      return `assigned to ${short(h.toValue)}`
    case 'REOPENED':
      return 'reopened this ticket'
    case 'CANCELLED':
      return 'cancelled this ticket'
    default:
      return h.action.toLowerCase().replaceAll('_', ' ')
  }
}

export default function TicketTimeline({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">No activity yet.</p>
  }
  return (
    <ol className="relative ml-2 border-l border-slate-200">
      {items.map((h) => (
        <li key={h.id} className="mb-5 ml-5">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
          <p className="text-sm text-slate-800">
            <span className="font-semibold">{h.actorName}</span> {describe(h)}
          </p>
          {h.note && <p className="mt-0.5 text-xs text-slate-500">Note: {h.note}</p>}
          <p className="text-xs text-slate-400">{formatDateTime(h.createdOn)}</p>
        </li>
      ))}
    </ol>
  )
}