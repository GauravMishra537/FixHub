import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * The answer of the free-unit search, as buttons. The person picks one.
 * avail: AvailabilityDto from the server. value: picked unit id.
 * onShowBigger: asked when every right-size unit is booked and bigger ones are free.
 */
export default function UnitPicker({ avail, loading, error, value, onPick, onShowBigger }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking free units...
      </div>
    )
  }
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!avail) return <div className="text-sm text-slate-400">Enter the headcount and a time to see free units.</div>

  if (avail.fitCapacity == null) {
    return <div className="text-sm text-red-600">{avail.message}</div>
  }

  return (
    <div className="space-y-2">
      {avail.units.length > 0 && (
        <div className="text-xs text-slate-500">
          {avail.biggerShown
            ? 'Bigger than needed. A reason is required.'
            : `Free for this time. Best fit is ${avail.fitCapacity} seats.`}
        </div>
      )}

      {avail.units.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {avail.units.map((u) => {
            const picked = u.id === value
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onPick(u.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  picked
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <span className="block font-medium text-slate-900">{u.name}</span>
                <span className="block text-xs text-slate-500">
                  {u.capacity} seats{u.location ? `, ${u.location}` : ''}
                </span>
                {u.oversize && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Bigger than needed
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {avail.noneFree && avail.units.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <div>{avail.message}</div>
          {avail.biggerAvailable && (
            <button
              type="button"
              onClick={onShowBigger}
              className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
            >
              Show bigger rooms
            </button>
          )}
        </div>
      )}
    </div>
  )
}