import React, { useEffect, useState } from 'react'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'

const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'REGISTRATION_REQUESTED',
  'EMAIL_VERIFIED',
  'USER_APPROVED',
  'USER_REJECTED',
  'USER_DELETED',
  'USER_PROFILE_UPDATED',
  'DEPARTMENT_CREATED',
  'DEPARTMENT_UPDATED',
  'DEPARTMENT_DELETED',
  'SKILL_CREATED',
  'SKILL_UPDATED',
  'SKILL_DELETED',
  'SKILL_REQUESTED',
  'SKILL_APPROVED',
  'SKILL_REJECTED',
  'SKILL_REMOVED',
  'SKILL_ADDED_BY_ADMIN',
  'SKILL_REMOVED_BY_ADMIN',
]

const FIELD =
  'px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function AuditLogsPage() {
  const [eventType, setEventType] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalPages: 0, totalElements: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    orgApi
      .auditLogs({ eventType, userId, page, size: 20 })
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load logs'))
  }, [eventType, userId, page])

  const onFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }

  return (
    <div>
      <PageHeader
        icon={ScrollText}
        title="Audit logs"
        subtitle="Who did what, and when. Only admins can see this."
        actions={
          <div className="flex gap-2">
            <select className={FIELD} value={eventType} onChange={onFilter(setEventType)}>
              <option value="">All events</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input className={`${FIELD} w-28`} placeholder="User id" value={userId} onChange={onFilter(setUserId)} />
          </div>
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
            {data.items.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                    {l.eventType}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{l.userEmail || '-'}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.description}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {data.totalElements} rows · page {data.totalPages === 0 ? 0 : page + 1} of {data.totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </button>
          <button
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuditLogsPage