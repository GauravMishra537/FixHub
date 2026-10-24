import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function SelectMenu({
  value,
  onChange,
  options, // [{ value, label }]
  placeholder = 'Select',
  disabled = false,
  autoOpen = false,
  onClose,
  className = '',
}) {
  const [open, setOpen] = useState(autoOpen)
  const ref = useRef(null)

  const close = () => {
    setOpen(false)
    onClose?.()
  }

  useEffect(() => {
    if (!open) return undefined
    const down = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    const key = (e) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const current = options.find((o) => String(o.value) === String(value))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      >
        <span className={current ? '' : 'text-slate-400'}>{current ? current.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 max-h-60 w-full min-w-[10rem] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((o) => {
            const active = String(o.value) === String(value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  close()
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                  active ? 'font-semibold text-blue-600' : 'text-slate-700'
                }`}
              >
                {o.label}
                {active && <Check className="h-4 w-4" />}
              </button>
            )
          })}
          {options.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">No options</div>}
        </div>
      )}
    </div>
  )
}