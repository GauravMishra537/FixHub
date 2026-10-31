import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sameDay, startOfDay } from '../utils/time'

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Month grid like Google Calendar. Sunday first.
 * value: the picked Date. onChange(date). minDate and maxDate grey out days outside.
 */
export default function MiniCalendar({ value, onChange, minDate, maxDate }) {
  const today = startOfDay(new Date())
  const lo = minDate ? startOfDay(minDate) : null
  const hi = maxDate ? startOfDay(maxDate) : null
  const start = value || lo || today
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1))

  const year = month.getFullYear()
  const m = month.getMonth()
  const lead = month.getDay() // empty cells before the 1st
  const count = new Date(year, m + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= count; d++) cells.push(new Date(year, m, d))

  const out = (d) => (lo && d < lo) || (hi && d > hi)
  const canPrev = !lo || new Date(year, m, 1) > lo
  const canNext = !hi || new Date(year, m + 1, 1) <= hi
  const shift = (n) => setMonth(new Date(year, m + n, 1))
  const title = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const dayClass = (d) => {
    if (out(d)) return 'cursor-not-allowed text-slate-400 opacity-40'
    if (value && sameDay(d, value)) return 'bg-blue-600 font-semibold text-white hover:bg-blue-700'
    if (sameDay(d, today)) return 'font-semibold text-blue-600 hover:bg-slate-100'
    return 'text-slate-700 hover:bg-slate-100'
  }

  return (
    <div className="w-[17.5rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="pl-1 text-sm font-semibold text-slate-900">{title}</span>
        <span className="flex items-center">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </span>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
        {WEEK.map((w, i) => (
          <span key={i} className="py-1">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              type="button"
              disabled={out(d)}
              onClick={() => onChange(d)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${dayClass(d)}`}
            >
              {d.getDate()}
            </button>
          ) : (
            <span key={i} />
          )
        )}
      </div>

      <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
            if (!out(today)) onChange(today)
          }}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
        >
          Today
        </button>
      </div>
    </div>
  )
}