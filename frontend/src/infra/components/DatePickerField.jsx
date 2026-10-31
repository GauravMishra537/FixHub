import React, { useEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { fmtDate } from '../utils/time'

/** A button that shows the date, like "Mon, 2 Nov", and opens the month grid under it. */
export default function DatePickerField({ value, onChange, minDate, maxDate, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const down = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const key = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-blue-500 focus:outline-none"
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="whitespace-nowrap">{value ? fmtDate(value) : 'Pick a date'}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1">
          <MiniCalendar
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(d) => {
              onChange(d)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}