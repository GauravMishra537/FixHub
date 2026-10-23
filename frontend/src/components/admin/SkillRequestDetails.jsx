import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Alert from '../common/Alert'
import SkillStatusBadge from '../common/SkillStatusBadge'
import { formatDateTime } from '../../utils/format'

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  )
}

/**
 * skill = one item of GET /api/admin/skill-requests
 * onApprove() and onReject(reason) return a promise. They throw on failure.
 */
export default function SkillRequestDetails({ skill, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = skill.status === 'PENDING'

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">{skill.skillName}</h3>
          <SkillStatusBadge status={skill.status} />
          {!skill.skillActive && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              new skill
            </span>
          )}
        </div>
        <dl className="divide-y divide-slate-100">
          <Row label="Employee">{skill.userFullName}</Row>
          {skill.userEmail && <Row label="Email">{skill.userEmail}</Row>}
          <Row label="Requested">{formatDateTime(skill.createdAt)}</Row>
          {skill.reviewedOn && <Row label="Reviewed">{formatDateTime(skill.reviewedOn)}</Row>}
          {skill.status === 'REJECTED' && skill.rejectReason && <Row label="Reason">{skill.rejectReason}</Row>}
        </dl>
      </section>

      {pending && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {error && <Alert>{error}</Alert>}
          {!skill.skillActive && (
            <p className="mb-3 text-xs text-slate-500">
              This is a new skill name. Approving it also makes it available to everyone.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(onApprove)}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve skill
          </button>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Reject with a reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Reason (required)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => run(() => onReject(reason.trim()))}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject skill
            </button>
          </div>
        </section>
      )}
    </div>
  )
}