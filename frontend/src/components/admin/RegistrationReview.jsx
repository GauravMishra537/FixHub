import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Alert from '../common/Alert'
import SkillStatusBadge from '../common/SkillStatusBadge'
import ProfileForm from './ProfileForm'
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
 * reg = registration request from GET /api/admin/requests
 * onApprove(body) and onReject(reason) return a promise. They throw on failure.
 */
export default function RegistrationReview({ reg, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = reg.requestStatus === 'PENDING'

  const submitReject = async () => {
    if (!reason.trim()) return
    setBusy(true)
    setError('')
    try {
      await onReject(reason.trim())
    } catch (e) {
      setError(e.message || 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <Row label="Name">{reg.fullName}</Row>
          <Row label="Email">{reg.email}</Row>
          <Row label="Status">
            <SkillStatusBadge status={reg.requestStatus} />
          </Row>
          <Row label="Email verified">{reg.emailVerified ? 'Yes' : 'No'}</Row>
          <Row label="Requested">{formatDateTime(reg.createdAt)}</Row>
          {reg.reviewedOn && <Row label="Reviewed">{formatDateTime(reg.reviewedOn)}</Row>}
          {reg.requestStatus === 'REJECTED' && reg.rejectionReason && (
            <Row label="Reason">{reg.rejectionReason}</Row>
          )}
        </dl>
      </section>

      {pending && !reg.emailVerified && (
        <Alert type="error">The applicant has not verified their email yet. You can approve after they verify.</Alert>
      )}

      {pending && reg.emailVerified && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Set details and approve</h3>
          <p className="mb-4 text-xs text-slate-500">
            All fields are optional. You can change them later in Users.
          </p>
          <ProfileForm submitLabel="Approve" onSubmit={onApprove} />
        </section>
      )}

      {pending && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Reject</h3>
          {error && <Alert>{error}</Alert>}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Reason (required)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitReject}
            disabled={busy || !reason.trim()}
            className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject registration
          </button>
        </section>
      )}
    </div>
  )
}