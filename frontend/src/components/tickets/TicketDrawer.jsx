import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import TicketDetailContent from './TicketDetailContent'

/**
 * Right-side panel with the ticket details, like a GitLab board.
 * ticketId null means closed.  onChanged is passed on so the board can refresh after an edit.
 */
export default function TicketDrawer({ ticketId, onClose, onChanged }) {
  // Esc closes it
  useEffect(() => {
    if (!ticketId) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ticketId, onClose])

  if (!ticketId) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* click outside the panel closes it */}
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-label="Ticket details"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Ticket details</h2>
          <div className="flex items-center gap-2">
            <Link
              to={`/tickets/${ticketId}`}
              className="inline-flex items-center rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open full page
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {/* key: opening another ticket starts clean, no edit form left over */}
          <TicketDetailContent key={ticketId} ticketId={ticketId} layout="panel" onChanged={onChanged} />
        </div>
      </aside>
    </div>
  )
}