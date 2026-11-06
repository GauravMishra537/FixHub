import React, { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { fmtDate } from '../utils/time'

/**
 * A button that shows the date, like "Mon, 2 Nov", and opens the month grid under it.
 * clearable: shows an X that calls onChange(null), for a date that may stay empty.
 * placeholder: the text when there is no date. align "right" opens the grid to the left, near a page edge.
 */
export default function DatePickerField({
  value,
  onChange,
  minDate,
  maxDate,
  className = '',
  clearable = false,
  placeholder = 'Pick a date',
  align = 'left',
}) {
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
        <span className={`whitespace-nowrap ${value ? '' : 'text-slate-400'}`}>
          {value ? fmtDate(value) : placeholder}
        </span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear the date"
            title="Clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                onChange(null)
              }
            }}
            className="ml-auto shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
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