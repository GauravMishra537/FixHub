import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import TicketStatusBadge, { PriorityBadge } from './TicketStatusBadge'
import { formatDate } from '../../utils/format'

// field = the backend sort name. no field means the column cannot be sorted
const COLUMNS = [
  { label: 'Ticket', field: 'ticketNo' },
  { label: 'Title', field: 'title' },
  { label: 'Category' },
  { label: 'Status', field: 'status' },
  { label: 'Priority', field: 'priority' },
  { label: 'Author' },
  { label: 'Assigned to' },
  { label: 'Created', field: 'createdOn' },
]

const PAGE_SIZES = [5, 10, 20, 50]

/**
 * data = { items, page, size, totalPages, totalElements }
 * Sorting and page size are optional: pass sortBy, direction, onSort, size, onSize to turn them on.
 */
export default function TicketTable({
  data,
  loading,
  onPage,
  emptyText = 'No tickets found',
  sortBy,
  direction,
  onSort,
  size,
  onSize,
}) {
  const navigate = useNavigate()
  const items = data?.items || []

  const header = (col) => {
    if (!col.field || !onSort) return col.label
    const active = sortBy === col.field
    const Icon = !active ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => onSort(col.field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide ${
          active ? 'text-blue-700' : 'hover:text-slate-800'
        }`}
      >
        {col.label}
        <Icon className="h-3 w-3" />
      </button>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className="px-4 py-3 font-semibold"
                  aria-sort={
                    sortBy && sortBy === col.field ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {header(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
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
                  <td className="px-4 py-3 text-slate-600">{t.authorName}</td>
                  <td className="px-4 py-3 text-slate-600">{t.assigneeName || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(t.createdOn)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.totalElements > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600">
          <span>
            Page {data.page + 1} of {Math.max(data.totalPages, 1)} ({data.totalElements} tickets)
          </span>
          <div className="flex items-center gap-3">
            {onSize && (
              <label className="flex items-center gap-2">
                Rows
                <select
                  value={size}
                  onChange={(e) => onSize(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {data.totalPages > 1 && (
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}