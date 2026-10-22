import React from 'react'
import { useNavigate } from 'react-router-dom'
import TicketStatusBadge, { PriorityBadge } from './TicketStatusBadge'
import { formatDate } from '../../utils/format'

// data = { items, page, totalPages, totalElements }
export default function TicketTable({ data, loading, onPage, emptyText = 'No tickets found' }) {
  const navigate = useNavigate()
  const items = data?.items || []

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Raised by</th>
              <th className="px-4 py-3 font-semibold">Assigned to</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            )}
            {!loading &&
              items.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="cursor-pointer border-b border-slate-50 hover:bg-blue-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-700">{t.ticketNo}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-800">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.categoryName || '-'}</td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.requesterName}</td>
                  <td className="px-4 py-3 text-slate-600">{t.assigneeName || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(t.createdOn)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
          <span>
            Page {data.page + 1} of {data.totalPages} ({data.totalElements} tickets)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={data.page === 0}
              onClick={() => onPage(data.page - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.page + 1 >= data.totalPages}
              onClick={() => onPage(data.page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}