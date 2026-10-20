import React from 'react'

const STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
}

export default function SkillStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}