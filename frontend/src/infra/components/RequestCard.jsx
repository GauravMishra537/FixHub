import React, { useEffect, useState } from 'react'
import { Check, Clock, Loader2, Minus, X } from 'lucide-react'
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

// ---------- the three circles: Author, Department, Admin ----------

const DOT = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-blue-600 text-white ring-4 ring-blue-200',
  rejected: 'bg-red-500 text-white',
  skipped: 'bg-slate-300 text-white',
  stopped: 'bg-slate-300 text-white',
  waiting: 'border-2 border-slate-300 bg-white text-slate-400',
}
const ICON = { done: Check, current: Clock, rejected: X, skipped: Minus, stopped: Minus, waiting: null }
const WORD_COLOR = {
  done: 'text-emerald-700',
  current: 'text-blue-700',
  rejected: 'text-red-600',
  skipped: 'text-slate-500',
  stopped: 'text-slate-500',
  waiting: 'text-slate-400',
}

const decided = (verb, name, on, note) =>
  [`${verb} by ${name || 'someone'}`, on ? formatDateTime(on) : '', note ? `"${note}"` : ''].filter(Boolean)

function buildSteps(r, authorName, createdOn) {
  const deptRejected = r.status === 'REJECTED' && !r.adminDecidedByName
  const adminRejected = r.status === 'REJECTED' && Boolean(r.adminDecidedByName)
  const skipped = r.approverId == null && !r.deptDecidedByName
  const ended = r.status === 'CANCELLED' || r.status === 'REJECTED'

  const author = {
    key: 'author',
    label: 'Author',
    state: 'done',
    word: 'Raised',
    title: authorName || 'Author',
    lines: [createdOn ? `Raised on ${formatDateTime(createdOn)}` : 'Raised the request'],
  }

  let dept
  if (deptRejected) {
    dept = { state: 'rejected', word: 'Rejected', lines: decided('Rejected', r.deptDecidedByName, r.deptDecidedOn, r.deptNote) }
  } else if (r.deptDecidedByName) {
    dept = { state: 'done', word: 'Approved', lines: decided('Approved', r.deptDecidedByName, r.deptDecidedOn, r.deptNote) }
  } else if (skipped) {
    dept = { state: 'skipped', word: 'Skipped', lines: ['No department approver was set, so it went straight to admin.'] }
  } else if (r.status === 'PENDING_DEPT') {
    dept = { state: 'current', word: 'Waiting', lines: [`Waiting for ${r.approverName || 'the approver'} to decide.`] }
  } else {
    dept = { state: 'stopped', word: 'Stopped', lines: ['The request ended before this step.'] }
  }

  let admin
  if (adminRejected) {
    admin = { state: 'rejected', word: 'Rejected', lines: decided('Rejected', r.adminDecidedByName, r.adminDecidedOn, r.adminNote) }
  } else if (r.adminDecidedByName) {
    admin = { state: 'done', word: 'Approved', lines: decided('Approved', r.adminDecidedByName, r.adminDecidedOn, r.adminNote) }
  } else if (r.status === 'PENDING_ADMIN') {
    admin = { state: 'current', word: 'Waiting', lines: ['Waiting for an admin to decide.'] }
  } else if (ended) {
    admin = { state: 'stopped', word: 'Stopped', lines: ['The request ended before this step.'] }
  } else {
    admin = { state: 'waiting', word: 'Not yet', lines: ['Starts after the department approves.'] }
  }

  let close
  if (r.status === 'CLOSED') {
    close = { state: 'done', word: 'Closed', lines: ['Closed by the author.'] }
  } else if (r.status === 'APPROVED') {
    close = {
      state: 'current',
      word: 'Waiting',
      lines: [
        r.kind === 'PHYSICAL'
          ? 'Waiting for the author to close it once the item is received.'
          : 'Waiting for the author to close it once access is given.',
      ],
    }
  } else if (ended) {
    close = { state: 'stopped', word: 'Stopped', lines: ['The request ended before this step.'] }
  } else {
    close = { state: 'waiting', word: 'Not yet', lines: ['Starts after the admin approves.'] }
  }

  return [
    author,
    { key: 'dept', label: 'Department', title: r.departmentName || 'Department', ...dept },
    { key: 'admin', label: 'Admin', title: 'Admin', ...admin },
    { key: 'close', label: 'Close', title: 'Close', ...close },
  ]
}

function Stepper({ steps }) {
  return (
    <div className="mb-5 flex items-start px-1">
      {steps.map((s, i) => {
        const Icon = ICON[s.state]
        const last = i === steps.length - 1
        // keep the hover card inside the page: first opens to the right, last to the left
        const pos = i === 0 ? 'left-0' : last ? 'right-0' : 'left-1/2 -translate-x-1/2'
        return (
          <React.Fragment key={s.key}>
            <div className="group relative w-24 shrink-0 text-center">
              <button
                type="button"
                aria-label={`${s.label}: ${s.word}`}
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full outline-none transition ${DOT[s.state]}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
              </button>
              <div className="mt-1.5 text-xs font-semibold text-slate-800">{s.label}</div>
              <div className={`text-[11px] font-medium ${WORD_COLOR[s.state]}`}>{s.word}</div>

              <div
                role="tooltip"
                className={`pointer-events-none invisible absolute top-full z-20 mt-2 w-60 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${pos}`}
              >
                <div className="font-semibold text-slate-900">{s.title}</div>
                {s.lines.map((l) => (
                  <div key={l} className="mt-0.5">
                    {l}
                  </div>
                ))}
              </div>
            </div>
            {!last && (
              <div
                className={`mt-[17px] h-0.5 flex-1 rounded-full ${
                  s.state === 'done' || s.state === 'skipped' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{children}</div>
    </div>
  )
}

/**
 * The Request card on a resource ticket: what was asked for and where it stands.
 * refreshKey: ticket.version. authorName and createdOn: from the ticket, for the first circle.
 */
export default function RequestCard({ ticketId, refreshKey, authorName, createdOn }) {
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
           <h2 className="mb-4 font-semibold text-slate-900">Request</h2>

      <Stepper steps={buildSteps(r, authorName, createdOn)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Item">{r.itemName || 'Removed item'}</Row>
        {r.kind === 'PHYSICAL' && <Row label="Quantity">{r.quantity}</Row>}
        <Row label="Category">
          {[r.groupName, r.categoryName].filter(Boolean).join(' / ') || '-'}
          {r.kind && <span className="ml-2 text-xs text-slate-400">{itemKindLabel(r.kind)}</span>}
        </Row>
        <Row label="Needed by">{day(r.neededBy) || 'No date'}</Row>
        <div className="sm:col-span-2">
          <Row label="Reason">{r.reason}</Row>
        </div>
      </div>
    </section>
  )
}