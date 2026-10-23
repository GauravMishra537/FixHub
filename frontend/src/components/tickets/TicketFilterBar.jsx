import React, { useEffect, useState } from 'react'
import { ArrowUpDown, CalendarDays, Flag, ListChecks, Search, Tag } from 'lucide-react'
import FilterMenu from '../common/FilterMenu'

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const SORT_OPTIONS = [
  { value: 'createdOn:desc', label: 'Newest first' },
  { value: 'createdOn:asc', label: 'Oldest first' },
  { value: 'priority:desc', label: 'Priority: high first' },
  { value: 'updatedOn:desc', label: 'Recently updated' },
]

const dateInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function dateSummary(from, to) {
  if (from && to) return `${from} to ${to}`
  if (from) return `from ${from}`
  if (to) return `until ${to}`
  return ''
}

/**
 * Row 1: title at the left, search box at the right.
 * Row 2: all filters as buttons in one row (wraps on a small screen).
 * filters, update, clear, activeCount come from useTicketFilters.
 * categories = [{ categoryId, name, count }] from GET /api/tickets/category-counts
 * extra: more filter buttons from the page, shown after Sort.
 */
export default function TicketFilterBar({
  filters,
  update,
  clear,
  activeCount,
  categories = [],
  title,
  showStatus = true,
  showSort = false,
  extra = null,
}) {
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

  const sortValue = `${filters.sortBy}:${filters.direction}`
  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortValue)?.label || 'Newest first'

  return (
    <div className="space-y-3 border-b border-slate-100 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : <span />}

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={text}
            maxLength={100}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by title or ticket number"
            aria-label="Search tickets"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.length > 0 && (
          <FilterMenu
            icon={Tag}
            label="Category"
            allLabel="All categories"
            options={categories.map((c) => ({ value: String(c.categoryId), label: c.name, hint: c.count }))}
            value={String(filters.categoryId || '')}
            onChange={(v) => update({ categoryId: v })}
          />
        )}

        {showStatus && (
          <FilterMenu
            icon={ListChecks}
            label="Status"
            multiple
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(v) => update({ status: v })}
          />
        )}

        <FilterMenu
          icon={Flag}
          label="Priority"
          allLabel="All priorities"
          options={PRIORITY_OPTIONS}
          value={filters.priority}
          onChange={(v) => update({ priority: v })}
        />

        <FilterMenu
          icon={CalendarDays}
          label="Created"
          summary={dateSummary(filters.createdFrom, filters.createdTo)}
        >
          <div className="w-56 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              From
              <input
                type="date"
                value={filters.createdFrom}
                max={filters.createdTo || undefined}
                onChange={(e) => update({ createdFrom: e.target.value })}
                className={`${dateInput} mt-1`}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              To
              <input
                type="date"
                value={filters.createdTo}
                min={filters.createdFrom || undefined}
                onChange={(e) => update({ createdTo: e.target.value })}
                className={`${dateInput} mt-1`}
              />
            </label>
          </div>
        </FilterMenu>

        {showSort && (
          <FilterMenu
            icon={ArrowUpDown}
            label="Sort"
            summary={sortLabel}
            active={false}
            options={SORT_OPTIONS}
            value={sortValue}
            onChange={(v) => {
              const [sortBy, direction] = v.split(':')
              update({ sortBy, direction })
            }}
          />
        )}

        {/* extra filter buttons from the page, for example Skill on the admin board */}
        {extra}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="px-2 py-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}