import React from 'react'

const STATUS = {
  NEW: ['New', 'bg-blue-100 text-blue-700'],
  OPEN: ['Open', 'bg-sky-100 text-sky-700'],
  ASSIGNED: ['Assigned', 'bg-indigo-100 text-indigo-700'],
  IN_PROGRESS: ['In progress', 'bg-amber-100 text-amber-700'],
  ON_HOLD: ['On hold', 'bg-slate-200 text-slate-700'],
  RESOLVED: ['Resolved', 'bg-green-100 text-green-700'],
  REOPENED: ['Reopened', 'bg-orange-100 text-orange-700'],
  CLOSED: ['Closed', 'bg-emerald-100 text-emerald-700'],
  CANCELLED: ['Cancelled', 'bg-slate-200 text-slate-600'],
  PENDING_APPROVAL: ['Pending approval', 'bg-yellow-100 text-yellow-700'],
  APPROVED: ['Approved', 'bg-green-100 text-green-700'],
  REJECTED: ['Rejected', 'bg-red-100 text-red-700'],
  ISSUED: ['Issued', 'bg-teal-100 text-teal-700'],
  RETURNED: ['Returned', 'bg-emerald-100 text-emerald-700'],
  ACCEPTED: ['Accepted', 'bg-indigo-100 text-indigo-700'],
}

const PRIORITY = {
  LOW: ['Low', 'bg-slate-100 text-slate-600'],
  MEDIUM: ['Medium', 'bg-blue-100 text-blue-700'],
  HIGH: ['High', 'bg-orange-100 text-orange-700'],
  URGENT: ['Urgent', 'bg-red-100 text-red-700'],
}

function Pill({ label, cls }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const [label, cls] = PRIORITY[priority] || [priority, 'bg-slate-100 text-slate-600']
  return <Pill label={label} cls={cls} />
}

export default function TicketStatusBadge({ status }) {
  const [label, cls] = STATUS[status] || [status, 'bg-slate-100 text-slate-600']
  return <Pill label={label} cls={cls} />
}