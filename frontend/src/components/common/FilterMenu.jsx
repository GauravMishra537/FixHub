import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

/**
 * A filter button that opens a small menu.
 *  - options = [{ value, label, hint }]  value = string (single) or array of strings (multiple)
 *  - allLabel: adds a first row with value '' that clears a single choice
 *  - summary: text shown after the label. Leave it out to show the chosen option.
 *  - active: blue look. Leave it out to be blue whenever something is chosen.
 *  - children: your own panel content (used for the date range) instead of the option rows
 */
export default function FilterMenu({
  icon: Icon,
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  allLabel,
  summary,
  active,
  align = 'left',
  children,
}) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  // click outside or Esc closes the menu
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const picked = multiple
    ? (value || []).map(String)
    : value === '' || value == null
      ? []
      : [String(value)]

  const rows = !multiple && allLabel ? [{ value: '', label: allLabel }, ...options] : options

  const pick = (v) => {
    if (multiple) {
      onChange(picked.includes(String(v)) ? picked.filter((p) => p !== String(v)) : [...picked, String(v)])
    } else {
      onChange(String(v))
      setOpen(false)
    }
  }

  let text = summary
  if (text === undefined) {
    if (picked.length === 0) text = ''
    else if (picked.length === 1) text = options.find((o) => String(o.value) === picked[0])?.label || ''
    else text = `${picked.length} selected`
  }
  const on = active ?? picked.length > 0

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          on
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
        }`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{text ? `${label}: ${text}` : label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children ? (
            <div className="p-2">{children}</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {rows.map((o) => {
                const chosen = o.value === '' ? picked.length === 0 : picked.includes(String(o.value))
                return (
                  <button
                    key={`${o.value}`}
                    type="button"
                    onClick={() => pick(o.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                      chosen ? 'font-semibold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center">
                        {chosen && <Check className="h-4 w-4" />}
                      </span>
                      {o.label}
                    </span>
                    {o.hint !== undefined && <span className="text-xs text-slate-400">{o.hint}</span>}
                  </button>
                )
              })}
              {rows.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Nothing to choose</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}