import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Check, X, Trash2, Loader2 } from 'lucide-react'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import SkillStatusBadge from '../../components/common/SkillStatusBadge'

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

// pending first, then approved, then rejected. newest first inside each group
const ORDER = { PENDING: 0, APPROVED: 1, REJECTED: 2 }

export function SkillReviewPage() {
  const [tab, setTab] = useState('ALL')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        orgApi.skillRequests('PENDING'),
        orgApi.skillRequests('APPROVED'),
        orgApi.skillRequests('REJECTED'),
      ])
      const all = [...(pending || []), ...(approved || []), ...(rejected || [])]
      all.sort(
        (a, b) =>
          (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || new Date(b.createdAt) - new Date(a.createdAt),
      )
      setRows(all)
    } catch (e) {
      setError(e.message || 'Could not load skill requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      PENDING: rows.filter((r) => r.status === 'PENDING').length,
      APPROVED: rows.filter((r) => r.status === 'APPROVED').length,
      REJECTED: rows.filter((r) => r.status === 'REJECTED').length,
    }),
    [rows],
  )

  const shown = tab === 'ALL' ? rows : rows.filter((r) => r.status === tab)

  const run = async (id, fn) => {
    setBusyId(id)
    setError('')
    try {
      await fn()
      setRejectingId(null)
      setReason('')
      await load()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Skill review"
        subtitle="Approve or reject skills employees add. Only approved skills count."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  setRejectingId(null)
                }}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label} <span className="opacity-70">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center text-sm text-slate-500 py-10">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : shown.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">
            No {tab === 'ALL' ? '' : `${tab.toLowerCase()} `}skill requests.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((r) => {
              const busy = busyId === r.userSkillId
              return (
                <li key={r.userSkillId} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {(r.userFullName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{r.skillName}</span>
                          <SkillStatusBadge status={r.status} />
                          {!r.skillActive && (
                            <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              new skill
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.userFullName}
                          {r.userEmail ? ` (${r.userEmail})` : ''} · {new Date(r.createdAt).toLocaleString()}
                        </div>
                        {r.status === 'REJECTED' && r.rejectReason && (
                          <div className="text-xs text-red-600 mt-0.5">Reason: {r.rejectReason}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => run(r.userSkillId, () => orgApi.approveSkill(r.userSkillId))}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              setRejectingId(r.userSkillId)
                              setReason('')
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-semibold"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            window.confirm(`Remove ${r.skillName} from ${r.userFullName}?`) &&
                            run(r.userSkillId, () => orgApi.removeUserSkill(r.userId, r.userSkillId))
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {rejectingId === r.userSkillId && (
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (reason.trim()) {
                          run(r.userSkillId, () => orgApi.rejectSkill(r.userSkillId, reason.trim()))
                        }
                      }}
                    >
                      <input
                        autoFocus
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="Reason for rejection (required)"
                        value={reason}
                        maxLength={500}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <button
                        disabled={busy || !reason.trim()}
                        className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => setRejectingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default SkillReviewPage