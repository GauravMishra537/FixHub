import React, { useEffect, useState } from 'react'
import { ClipboardCheck, Check, X, Trash2, Loader2 } from 'lucide-react'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import SkillStatusBadge from '../../components/common/SkillStatusBadge'

const TABS = ['PENDING', 'APPROVED', 'REJECTED']

export function SkillReviewPage() {
  const [status, setStatus] = useState('PENDING')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [reason, setReason] = useState('')

  const load = async (s = status) => {
    setLoading(true)
    try {
      setRows(await orgApi.skillRequests(s))
    } catch (e) {
      setError(e.message || 'Could not load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setError('')
    setRejectingId(null)
    load(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const run = async (fn) => {
    setError('')
    try {
      await fn()
      setRejectingId(null)
      setReason('')
      await load()
    } catch (e) {
      setError(e.message || 'Action failed')
    }
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Skill review"
        subtitle="Accept or reject skills employees add. Only accepted skills count."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setStatus(t)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
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
        ) : rows.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">No {status.toLowerCase()} skills.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.userSkillId} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {(r.userFullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {r.skillName}
                        {!r.skillActive && (
                          <span className="ml-2 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
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
                    <SkillStatusBadge status={r.status} />
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => run(() => orgApi.approveSkill(r.userSkillId))}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => setRejectingId(r.userSkillId)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() =>
                          window.confirm(`Remove ${r.skillName} from ${r.userFullName}?`) &&
                          run(() => orgApi.removeUserSkill(r.userId, r.userSkillId))
                        }
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
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
                      if (reason.trim()) run(() => orgApi.rejectSkill(r.userSkillId, reason.trim()))
                    }}
                  >
                    <input
                      autoFocus
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="Reason for rejection"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <button className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
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
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default SkillReviewPage