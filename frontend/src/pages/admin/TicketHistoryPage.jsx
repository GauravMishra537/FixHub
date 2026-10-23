import React, { useEffect, useState } from 'react'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'

// Ticket-related audit events.
// These event names must match the events recorded by the backend.
const TICKET_EVENTS = [
  // Ticket lifecycle
  'TICKET_CREATED',
  'TICKET_UPDATED',
  'TICKET_DELETED',

  // Assignment
  'TICKET_ASSIGNED',
  'TICKET_REASSIGNED',

  // Status changes
  'TICKET_STATUS_CHANGED',
  'TICKET_RESOLVED',
  'TICKET_CLOSED',
  'TICKET_REOPENED',

  // Communication
  'TICKET_RESPONSE_ADDED',
  'TICKET_COMMENT_ADDED',

  // Other ticket changes
  'TICKET_PRIORITY_CHANGED',
  'TICKET_DUE_DATE_CHANGED',
  'TICKET_ATTACHMENT_ADDED',

  // Ticket categories
  'TICKET_CATEGORY_CREATED',
  'TICKET_CATEGORY_UPDATED',
  'TICKET_CATEGORY_DELETED',
]

const PAGE_SIZE = 20
const MERGED_SIZE = 50

const FIELD =
  'px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const EVENT_GROUPS = [
  {
    label: 'Ticket lifecycle',
    events: [
      ['TICKET_CREATED', 'Ticket Created'],
      ['TICKET_UPDATED', 'Ticket Updated'],
      ['TICKET_DELETED', 'Ticket Deleted'],
    ],
  },
  {
    label: 'Assignment',
    events: [
      ['TICKET_ASSIGNED', 'Ticket Assigned'],
      ['TICKET_REASSIGNED', 'Ticket Reassigned'],
    ],
  },
  {
    label: 'Status',
    events: [
      ['TICKET_STATUS_CHANGED', 'Status Changed'],
      ['TICKET_RESOLVED', 'Ticket Resolved'],
      ['TICKET_CLOSED', 'Ticket Closed'],
      ['TICKET_REOPENED', 'Ticket Reopened'],
    ],
  },
  {
    label: 'Communication',
    events: [
      ['TICKET_RESPONSE_ADDED', 'Response Added'],
      ['TICKET_COMMENT_ADDED', 'Comment Added'],
    ],
  },
  {
    label: 'Other changes',
    events: [
      ['TICKET_PRIORITY_CHANGED', 'Priority Changed'],
      ['TICKET_DUE_DATE_CHANGED', 'Due Date Changed'],
      ['TICKET_ATTACHMENT_ADDED', 'Attachment Added'],
    ],
  },
  {
    label: 'Categories',
    events: [
      ['TICKET_CATEGORY_CREATED', 'Category Created'],
      ['TICKET_CATEGORY_UPDATED', 'Category Updated'],
      ['TICKET_CATEGORY_DELETED', 'Category Deleted'],
    ],
  },
]

const EVENT_LABELS = Object.fromEntries(
  EVENT_GROUPS.flatMap((group) => group.events),
)

export function TicketHistoryPage() {
  const [eventType, setEventType] = useState('')
  const [page, setPage] = useState(0)

  const [data, setData] = useState({
    items: [],
    totalPages: 0,
    totalElements: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      setLoading(true)
      setError('')

      try {
        let result

        if (eventType) {
          // Load one specific event type using backend pagination.
          result = await orgApi.auditLogs({
            eventType,
            page,
            size: PAGE_SIZE,
          })
        } else {
          // Load recent records for each known ticket event.
          const results = await Promise.all(
            TICKET_EVENTS.map((type) =>
              orgApi.auditLogs({
                eventType: type,
                page: 0,
                size: MERGED_SIZE,
              }),
            ),
          )

          // Merge and sort events from all ticket-related categories.
          const allItems = results
            .flatMap((response) => response.items || [])
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )

          // Remove duplicate records if an API response contains duplicates.
          const uniqueItems = Array.from(
            new Map(allItems.map((item) => [item.id, item])).values(),
          )

          // Paginate the merged results on the client.
          const startIndex = page * PAGE_SIZE
          const pageItems = uniqueItems.slice(
            startIndex,
            startIndex + PAGE_SIZE,
          )

          result = {
            items: pageItems,
            totalElements: uniqueItems.length,
            totalPages: Math.ceil(uniqueItems.length / PAGE_SIZE),
          }
        }

        if (!cancelled) {
          setData({
            items: result.items || [],
            totalPages: result.totalPages || 0,
            totalElements: result.totalElements || 0,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load ticket history')
          setData({
            items: [],
            totalPages: 0,
            totalElements: 0,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [eventType, page])

  const onFilter = (event) => {
    setEventType(event.target.value)
    setPage(0)
  }

  const formatDate = (date) => {
    if (!date) return '-'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleString()
  }

  const getEventLabel = (type) => {
    return EVENT_LABELS[type] || type || 'Unknown event'
  }

  const hasPreviousPage = page > 0
  const hasNextPage = page + 1 < data.totalPages

  return (
    <div>
      <PageHeader
        icon={History}
        title="Ticket history"
        subtitle="Track ticket activity, assignments, responses, and status changes. Only admins can see this."
        actions={
          <select
            className={FIELD}
            value={eventType}
            onChange={onFilter}
            aria-label="Filter ticket history by event"
          >
            <option value="">All ticket events</option>

            {EVENT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.events.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Description</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading ticket history...
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              data.items.map((log, index) => (
                <tr
                  key={log.id ?? `${log.eventType}-${log.createdAt}-${index}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                    {formatDate(log.createdAt)}
                  </td>

                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {log.eventType}
                    </span>
                    <div className="mt-1 text-xs text-slate-500">
                      {getEventLabel(log.eventType)}
                    </div>
                  </td>

                  <td className="px-4 py-2.5 text-slate-700">
                    {log.userEmail || '-'}
                  </td>

                  <td className="px-4 py-2.5 text-slate-600 min-w-[280px]">
                    {log.description || '-'}
                  </td>
                </tr>
              ))}

            {!loading && !error && data.items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No ticket history found.
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Ticket history could not be loaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
        <span>
          {data.totalElements} records
          {' · '}
          Page {data.totalPages === 0 ? 0 : page + 1} of {data.totalPages}
        </span>

        <div className="flex gap-2">
          <button
            disabled={loading || !hasPreviousPage}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <button
            disabled={loading || !hasNextPage}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {!eventType && (
        <p className="mt-3 text-xs text-slate-400">
          Showing the latest {MERGED_SIZE} records per event type, merged by
          time. Select a specific event to browse its backend-paginated
          history.
        </p>
      )}
    </div>
  )
}

export default TicketHistoryPage