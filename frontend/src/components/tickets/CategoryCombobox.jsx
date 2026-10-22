import React, { useEffect, useRef, useState } from 'react'
import { ticketCoreApi } from '../../api/ticketCore'

export default function CategoryCombobox({
  value,
  onChange,
  type = 'ISSUE',
  disabled = false,
  placeholder = 'Type to search or add a category',
}) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState([])
  const [active, setActive] = useState(-1)
  const wrapRef = useRef(null)
  const reqId = useRef(0)

  // wait 300 ms after the last key. answers that arrive late are ignored
  useEffect(() => {
    if (!open) return undefined
    const id = ++reqId.current
    const timer = setTimeout(async () => {
      try {
        const list = await ticketCoreApi.suggestCategories(type, value || '')
        if (id === reqId.current) {
          setOptions(list || [])
          setActive(-1)
        }
      } catch {
        if (id === reqId.current) setOptions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value, open, type])

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = (name) => {
    onChange(name)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault()
      pick(options[active].name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const typed = (value || '').trim()
  const exact = options.some((o) => o.name.toLowerCase() === typed.toLowerCase())

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        maxLength={100}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
      />
      {open && !disabled && (options.length > 0 || typed.length >= 2) && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.name)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {o.name}
              </button>
            </li>
          ))}
          {typed.length >= 2 && !exact && (
            <li className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              New category will be created: <span className="font-medium text-slate-700">{typed}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}