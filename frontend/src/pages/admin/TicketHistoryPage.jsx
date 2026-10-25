import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { ticketHistoryApi } from '../../api/ticketHistory'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import SelectMenu from '../../components/common/SelectMenu'

const PAGE_SIZE = 20

const label = (a) => {
  const t = a.replaceAll('_', ' ').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// what happened, in one line
function describe(r) {
  if (r.fieldName) {
    return `${r.fieldName}: ${r.fromValue || 'empty'} \u2192 ${r.toValue || 'empty'}`
  }
  if (r.fromValue || r.toValue) return `${r.fromValue || 'empty'} \u2192 ${r.toValue || 'empty'}`
  return r.note || ''
}

export function TicketHistoryPage() {
  const [actions, setActions] = useState([])
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ticketHistoryApi
      .actions()
      .then((a) => setActions(a || []))
      .catch(() => setActions([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ticketHistoryApi
      .list({ action, page, size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load ticket history')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [action, page])

  const options = [{ value: '', label: 'All ticket events' }, ...actions.map((a) => ({ value: a, label: label(a) }))]

  return (
    <div>
      <PageHeader
        icon={History}
        title="Ticket history"
        subtitle="Every change on every ticket, newest first. Only admins can see this."
        actions={
          <SelectMenu
            className="w-56"
            value={action}
            options={options}
            onChange={(v) => {
              setAction(v)
              setPage(0)
            }}
          />
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">By</th>
              <th className="px-4 py-3 font-semibold">What changed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                    {new Date(r.createdOn).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link to={`/tickets/${r.ticketId}`} className="font-semibold text-blue-600 hover:underline">
                      {r.ticketNo || `#${r.ticketId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{r.actorName || '-'}</td>
                  <td className="max-w-md truncate px-4 py-2.5 text-slate-600" title={describe(r)}>
                    {describe(r)}
                  </td>
                </tr>
              ))}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No ticket history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {data.totalElements} rows &middot; page {data.totalPages === 0 ? 0 : page + 1} of {data.totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </button>
          <button
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketHistoryPage