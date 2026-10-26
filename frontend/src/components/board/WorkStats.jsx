import React, { useCallback, useEffect, useState } from 'react'
import { ticketCoreApi } from '../../api/ticketCore'

// 36.5 hours -> "1.5 days". under 48 hours stays in hours
function formatHours(h) {
  if (h === null || h === undefined) return '-'
  if (h < 1) return 'under 1 h'
  if (h < 48) return `${h} h`
  return `${(h / 24).toFixed(1)} days`
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

/** My work in numbers. Shows only for people who have been given a ticket at least once. */
export default function WorkStats() {
  const [stats, setStats] = useState(null)

  const load = useCallback(async () => {
    try {
      setStats(await ticketCoreApi.workStats())
    } catch {
      setStats(null)
    }
  }, [])

  useEffect(() => {
    load()
    // a claim, a status move or an assignment anywhere on the page: numbers change
    window.addEventListener('tickets:changed', load)
    return () => window.removeEventListener('tickets:changed', load)
  }, [load])

  if (!stats || stats.assignedNow + stats.resolvedTotal === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 pb-4 pt-4 md:grid-cols-4">
      <Tile label="Assigned to me" value={stats.assignedNow} />
      <Tile label="Resolved by me" value={stats.resolvedTotal} />
      <Tile label="Resolved this month" value={stats.resolvedThisMonth} />
      <Tile label="Average time to resolve" value={formatHours(stats.averageHours)} />
    </div>
  )
}