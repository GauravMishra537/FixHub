import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { resourcesApi } from '../../api/resources'
import { formatDateTime } from '../../utils/format'
import { itemKindLabel } from '../../resources/utils/meta.js'

const day = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null

// one plain sentence: where the request is now and who moves next
function stage(r) {
  switch (r.status) {
    case 'PENDING_DEPT':
      return `Waiting for ${r.approverName || r.departmentName || 'the department'} to approve.`
    case 'PENDING_ADMIN':
      return 'Department approved. Waiting for an admin.'
    case 'APPROVED':
      return r.kind === 'PHYSICAL'
        ? 'Approved. Close this ticket when you have received the item.'
        : 'Approved. Close this ticket when you have got access.'
    case 'REJECTED':
      return `Rejected${r.adminDecidedByName ? ' by admin' : r.deptDecidedByName ? ' by the department' : ''}.`
    case 'CANCELLED':
      return 'Cancelled by the author. Any stock held was released.'
    case 'CLOSED':
      return 'Closed by the author.'
    default:
      return ''
  }
}

const TONE = {
  PENDING_DEPT: 'bg-amber-50 text-amber-800',
  PENDING_ADMIN: 'bg-violet-50 text-violet-800',
  APPROVED: 'bg-emerald-50 text-emerald-800',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  CLOSED: 'bg-slate-100 text-slate-600',
}

function Row({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  )
}

const decision = (name, on, note) =>
  `${name}, ${formatDateTime(on)}${note ? `. "${note}"` : ''}`

/** The Request card on a resource ticket: what was asked for and where it stands. refreshKey: ticket.version. */
export default function RequestCard({ ticketId, refreshKey }) {
  const [r, setR] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    resourcesApi
      .details(ticketId)
      .then((d) => live && (setR(d), setError('')))
      .catch((e) => live && setError(e.message || 'Could not load the request'))
    return () => {
      live = false
    }
  }, [ticketId, refreshKey])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
    )
  }
  if (!r) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }

  const deptStep = r.deptDecidedByName
    ? decision(r.deptDecidedByName, r.deptDecidedOn, r.deptNote)
    : r.approverName
    ? `Waiting for ${r.approverName}`
    : 'Skipped. No department approver'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Request</h2>

      <div className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${TONE[r.status] || 'bg-slate-100 text-slate-600'}`}>
        {stage(r)}
        {r.holding && r.kind === 'PHYSICAL' && (
          <span className="ml-1 font-normal">Stock is held for this request.</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Item">{r.itemName || 'Removed item'}</Row>
        <Row label="Quantity">{r.quantity}</Row>
        <Row label="Category">
          {[r.groupName, r.categoryName].filter(Boolean).join(' / ') || '-'}
          {r.kind && <span className="ml-2 text-xs text-slate-400">{itemKindLabel(r.kind)}</span>}
        </Row>
        <Row label="Needed by">{day(r.neededBy) || 'No date'}</Row>
        <div className="sm:col-span-2">
          <Row label="Reason">{r.reason}</Row>
        </div>
        <Row label={`Department step${r.departmentName ? ` (${r.departmentName})` : ''}`}>{deptStep}</Row>
        <Row label="Admin step">
          {r.adminDecidedByName ? decision(r.adminDecidedByName, r.adminDecidedOn, r.adminNote) : '-'}
        </Row>
      </div>
    </section>
  )
}