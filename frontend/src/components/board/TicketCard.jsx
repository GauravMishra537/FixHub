import React from 'react'
import TicketStatusBadge, { PriorityBadge } from '../tickets/TicketStatusBadge'

import { formatDate } from '../../utils/format'

// left edge colour follows the priority, like a GitLab card
const EDGE = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-400',
  MEDIUM: 'border-l-blue-400',
  LOW: 'border-l-slate-300',
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

/**
 * ticket = one item of the ticket list (TicketListItemDto).
 * onOpen(ticket): the card was clicked.  selected: the card whose panel is open.
 * extra: room for a badge later, for example "2 claims waiting".
 */
export default function TicketCard({ ticket, onOpen, selected = false, extra = null }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(ticket)}
      className={`block w-full min-w-0 rounded-lg border border-l-4 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
        EDGE[ticket.priority] || 'border-l-slate-300'
      } ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
    >
      <div
        className="text-sm font-medium text-slate-900"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {ticket.title}
      </div>

      <div className="mt-1 text-xs font-medium text-blue-700">{ticket.ticketNo}</div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={ticket.priority} />
        <TicketStatusBadge status={ticket.status} />
        {ticket.categoryName && (
          <span className="inline-block whitespace-nowrap rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {ticket.categoryName}
          </span>
        )}
      </div>

      {extra && <div className="mt-2">{extra}</div>}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(ticket.createdOn)}</span>
        <span className="flex items-center gap-1.5" title={ticket.assigneeName ? `Assigned to ${ticket.assigneeName}` : `Raised by ${ticket.authorName}`}>
          {ticket.assigneeName ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {initials(ticket.assigneeName)}
              </span>
              <span className="max-w-[90px] truncate">{ticket.assigneeName}</span>
            </>
          ) : (
            <span className="max-w-[120px] truncate text-slate-400">by {ticket.authorName}</span>
          )}
        </span>
      </div>
    </button>
  )
}