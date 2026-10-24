import React, { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (v) => {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  return { y, m: m - 1, d }
}
const ym = (p) => p.y * 12 + p.m

const NAV = 'rounded-lg p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'
const HEAD = 'rounded-lg px-2 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100'

/**
 * value, min, max are YYYY-MM-DD strings. max blocks later dates, min blocks earlier ones.
 * Click the month name or the year in the header to jump straight to another month or year.
 */
export default function DatePicker({ value, onChange, placeholder = 'Pick date', min, max, className = '' }) {
  const sel = parse(value)
  const minP = parse(min)
  const maxP = parse(max)
  const now = new Date()
  const todayP = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() }
  const today = iso(todayP.y, todayP.m, todayP.d)
  const todayBlocked = Boolean((min && today < min) || (max && today > max))

  // first month shown: the chosen date, else today, never outside the allowed range
  const startView = () => {
    let v = sel || todayP
    if (maxP && ym(v) > ym(maxP)) v = maxP
    if (minP && ym(v) < ym(minP)) v = minP
    return { y: v.y, m: v.m }
  }

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('days') // days | months | years
  const [view, setView] = useState(startView)
  const [yearStart, setYearStart] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setView(startView())
    setMode('days')
    const down = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const key = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const monthBlocked = (y, m) => {
    const t = y * 12 + m
    return Boolean((maxP && t > ym(maxP)) || (minP && t < ym(minP)))
  }
  const yearBlocked = (y) => Boolean((maxP && y > maxP.y) || (minP && y < minP.y))

  // keep the shown month inside the allowed range when the year changes
  const clamp = (y, m) => {
    let t = y * 12 + m
    if (maxP && t > ym(maxP)) t = ym(maxP)
    if (minP && t < ym(minP)) t = ym(minP)
    return { y: Math.floor(t / 12), m: t % 12 }
  }

  const target = (delta) => {
    const t = view.y * 12 + view.m + delta
    return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }
  }
  const moveMonth = (delta) => {
    const n = target(delta)
    if (!monthBlocked(n.y, n.m)) setView(n)
  }

  const openYears = () => {
    setYearStart(Math.floor(view.y / 12) * 12)
    setMode('years')
  }

  const pick = (v) => {
    onChange(v)
    setOpen(false)
  }

  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const total = new Date(view.y, view.m + 1, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  const label = sel ? `${pad(sel.d)} ${MONTHS[sel.m]} ${sel.y}` : placeholder

  return (
    <div ref={ref} className={`relative block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-400"
      >
        <CalendarDays className="h-4 w-4 text-slate-500" />
        <span className={sel ? '' : 'text-slate-400'}>{label}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* header */}
          {mode === 'days' && (
            <div className="mb-2 flex items-center justify-between">
              <button type="button" className={NAV} onClick={() => moveMonth(-1)} disabled={monthBlocked(target(-1).y, target(-1).m)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                <button type="button" className={HEAD} onClick={() => setMode('months')}>
                  {MONTHS_LONG[view.m]}
                </button>
                <button type="button" className={HEAD} onClick={openYears}>
                  {view.y}
                </button>
              </div>
              <button type="button" className={NAV} onClick={() => moveMonth(1)} disabled={monthBlocked(target(1).y, target(1).m)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === 'months' && (
            <div className="mb-2 flex items-center justify-between">
              <button type="button" className={NAV} onClick={() => setView((v) => ({ ...v, y: v.y - 1 }))} disabled={yearBlocked(view.y - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" className={HEAD} onClick={openYears}>
                {view.y}
              </button>
              <button type="button" className={NAV} onClick={() => setView((v) => ({ ...v, y: v.y + 1 }))} disabled={yearBlocked(view.y + 1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === 'years' && (
            <div className="mb-2 flex items-center justify-between">
              <button type="button" className={NAV} onClick={() => setYearStart((s) => s - 12)} disabled={Boolean(minP && yearStart <= minP.y)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900">
                {yearStart} - {yearStart + 11}
              </span>
              <button type="button" className={NAV} onClick={() => setYearStart((s) => s + 12)} disabled={Boolean(maxP && yearStart + 11 >= maxP.y)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* body */}
          {mode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
                {DAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />
                  const v = iso(view.y, view.m, d)
                  const disabled = Boolean((min && v < min) || (max && v > max))
                  const active = v === value
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(v)}
                      className={`h-8 w-8 rounded-lg text-sm disabled:opacity-30 disabled:hover:bg-transparent ${
                        active
                          ? 'bg-blue-600 font-semibold text-white'
                          : v === today
                          ? 'border border-blue-400 text-slate-900 hover:bg-slate-100'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {mode === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((name, m) => {
                const blocked = monthBlocked(view.y, m)
                const current = m === view.m
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={blocked}
                    onClick={() => {
                      setView({ y: view.y, m })
                      setMode('days')
                    }}
                    className={`rounded-lg py-2 text-sm disabled:opacity-30 disabled:hover:bg-transparent ${
                      current ? 'bg-blue-600 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}

          {mode === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => {
                const blocked = yearBlocked(y)
                const current = y === view.y
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={blocked}
                    onClick={() => {
                      setView(clamp(y, view.m))
                      setMode('months')
                    }}
                    className={`rounded-lg py-2 text-sm disabled:opacity-30 disabled:hover:bg-transparent ${
                      current ? 'bg-blue-600 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs font-medium">
            <button type="button" onClick={() => pick('')} className="text-slate-500 hover:text-slate-800">
              Clear
            </button>
            <button
              type="button"
              disabled={todayBlocked}
              onClick={() => pick(today)}
              className="text-blue-600 hover:text-blue-700 disabled:opacity-30"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}