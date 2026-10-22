import React, { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

const STATUS_CHIPS = [
  ['NEW', 'New'],
  ['ASSIGNED', 'Assigned'],
  ['IN_PROGRESS', 'In progress'],
  ['ON_HOLD', 'On hold'],
  ['RESOLVED', 'Resolved'],
  ['REOPENED', 'Reopened'],
  ['CLOSED', 'Closed'],
  ['CANCELLED', 'Cancelled'],
]

const chip = (on) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    on
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-700'
  }`

const input =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

/**
 * filters, update, clear, activeCount come from useTicketFilters.
 * categories = [{ categoryId, name, count }] from GET /api/tickets/category-counts
 */
export default function TicketFilterBar({ filters, update, clear, activeCount, categories = [] }) {
  // the box shows what the user types at once. the URL and the list follow 400 ms after the last key
  const [text, setText] = useState(filters.q)

  // URL changed from outside (Clear button, back button): show it in the box
  useEffect(() => {
    setText(filters.q)
  }, [filters.q])

  useEffect(() => {
    if (text.trim() === filters.q) return undefined
    const timer = setTimeout(() => update({ q: text.trim() }, { replace: true }), 400)
    return () => clearTimeout(timer)
  }, [text, filters.q, update])

  const toggleStatus = (value) => {
    const next = filters.status.includes(value)
      ? filters.status.filter((s) => s !== value)
      : [...filters.status, value]
    update({ status: next })
  }

  const toggleCategory = (id) => {
    update({ categoryId: String(filters.categoryId) === String(id) ? '' : String(id) })
  }

  return (
    <div className="space-y-3 border-b border-slate-100 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={text}
            maxLength={100}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by title or ticket number"
            className={`${input} w-full pl-9`}
          />
        </div>

        <select
          value={filters.priority}
          onChange={(e) => update({ priority: e.target.value })}
          className={input}
          aria-label="Priority"
        >
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="date"
            value={filters.createdFrom}
            max={filters.createdTo || undefined}
            onChange={(e) => update({ createdFrom: e.target.value })}
            className={input}
            aria-label="Created from"
          />
          <span>to</span>
          <input
            type="date"
            value={filters.createdTo}
            min={filters.createdFrom || undefined}
            onChange={(e) => update({ createdTo: e.target.value })}
            className={input}
            aria-label="Created to"
          />
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
        {STATUS_CHIPS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleStatus(value)}
            className={chip(filters.status.includes(value))}
          >
            {label}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
          {categories.map((c) => (
            <button
              key={c.categoryId}
              type="button"
              onClick={() => toggleCategory(c.categoryId)}
              className={chip(String(filters.categoryId) === String(c.categoryId))}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      )}
    </div>
  )
}