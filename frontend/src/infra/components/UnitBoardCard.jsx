import React from 'react'
import { Link } from 'react-router-dom'
import { sameDay } from '../utils/time'

const clock = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

// "10:00 am to 11:00 am", "All day", or "until 11:00 am" when it began before this day
function slotTime(slot, from) {
  if (slot.allDay) return 'All day'
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  return start < from ? `until ${clock(end)}` : `${clock(start)} to ${clock(end)}`
}

/**
 * One unit on the board. booked = it has sessions on this day: a day strip plus the list.
 * empty = nothing booked: shows "Free all day".
 * from, to: the day. showNow: the day is today, so the running session gets a "Now" mark.
 */
export default function UnitBoardCard({ unit, from, to, showNow }) {
  const dayMs = to.getTime() - from.getTime()
  const now = new Date()
  const booked = unit.slots.length > 0

  const pct = (t) => Math.min(100, Math.max(0, ((t - from.getTime()) / dayMs) * 100))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{unit.name}</div>
          <div className="text-xs text-slate-500">
            {unit.capacity} seats{unit.location ? `, ${unit.location}` : ''}
          </div>
        </div>
        {!booked && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Free all day
          </span>
        )}
      </div>

      {booked && (
        <>
          {/* the day as a strip. 12 am on the left, 12 am on the right */}
          <div className="relative mt-3 h-3 rounded-full bg-slate-100">
            {unit.slots.map((s) => {
              const left = pct(new Date(s.startTime).getTime())
              const right = pct(new Date(s.endTime).getTime())
              return (
                <span
                  key={s.bookingId}
                  title={`${s.title}, ${slotTime(s, from)}`}
                  className={`absolute top-0 h-3 rounded-full ${s.status === 'PENDING' ? 'bg-violet-400' : 'bg-emerald-500'}`}
                  style={{ left: `${left}%`, width: `${Math.max(right - left, 1.5)}%` }}
                />
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>12a</span>
            <span>6a</span>
            <span>12p</span>
            <span>6p</span>
            <span>12a</span>
          </div>

          <ul className="mt-2 space-y-2">
            {unit.slots.map((s) => {
              const running =
                showNow && sameDay(from, now) && new Date(s.startTime) <= now && now < new Date(s.endTime)
              const title = s.ticketId ? (
                <Link to={`/tickets/${s.ticketId}`} className="hover:underline">
                  {s.title}
                </Link>
              ) : (
                s.title
              )
              return (
                <li key={s.bookingId} className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-800">{slotTime(s, from)}</span>
                    {running && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Now
                      </span>
                    )}
                    {s.status === 'PENDING' && (
                      <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        Pending approval
                      </span>
                    )}
                    {s.mine && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Yours
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-900">{title}</div>
                  <div className="text-xs text-slate-500">{s.teamName || 'No team'}</div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}