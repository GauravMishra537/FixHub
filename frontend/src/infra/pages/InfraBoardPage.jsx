import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { infraApi } from '../../api/infra'
import SelectMenu from '../../components/common/SelectMenu'
import DatePickerField from '../components/DatePickerField'
import UnitBoardCard from '../components/UnitBoardCard'
import { MAX_DAYS_AHEAD, addDays, startOfDay } from '../utils/time'

function Column({ title, count, accent, empty, children }) {
  return (
    <section className={`rounded-2xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm ${accent}`}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
      </div>
      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  )
}

/** Booked and Empty units of one kind for one day. Everyone sees title, team and time. */
export default function InfraBoardPage({ embedded = false }) { {
  const [types, setTypes] = useState([])
  const [typeId, setTypeId] = useState('')
  const [date, setDate] = useState(() => startOfDay(new Date()))
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = useRef(0)

  useEffect(() => {
    infraApi
      .types()
      .then((list) => {
        setTypes(list)
        if (list.length > 0) setTypeId(String(list[0].id))
      })
      .catch((e) => setError(e.message || 'Could not load'))
  }, [])

  const day = date.getTime()
  const load = useCallback(
    async (silent) => {
      if (!typeId) return
      const id = ++token.current
      if (!silent) setLoading(true)
      try {
        const from = startOfDay(new Date(day))
        const result = await infraApi.board({ infraTypeId: typeId, from, to: addDays(from, 1) })
        if (id !== token.current) return
        setBoard(result)
        setError('')
      } catch (e) {
        if (id === token.current) setError(e.message || 'Could not load the board')
      } finally {
        if (id === token.current) setLoading(false)
      }
    },
    [typeId, day],
  )

  // load again at once on a new kind or day, and quietly every minute
  useEffect(() => {
    load(false)
    const timer = setInterval(() => load(true), 60000)
    return () => clearInterval(timer)
  }, [load])

  const from = startOfDay(date)
  const to = addDays(from, 1)
  const today = startOfDay(new Date())
  const maxDate = addDays(today, MAX_DAYS_AHEAD)

  const units = board?.units || []
  const booked = units.filter((u) => u.status === 'ACTIVE' && u.slots.length > 0)
  const empty = units.filter((u) => u.status === 'ACTIVE' && u.slots.length === 0)
  const off = units.filter((u) => u.status !== 'ACTIVE').length

  return (
    <div className="mx-auto max-w-5xl">
      {!embedded && (
        <>
          <Link to="/infra" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Infra
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Who booked what</h1>
        </>
      )}
      <p className="mb-4 text-sm text-slate-500">Booked and empty units for one day. Updates every minute.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SelectMenu
          className="w-52"
          value={typeId}
          onChange={setTypeId}
          options={types.map((t) => ({ value: String(t.id), label: t.name }))}
          placeholder="Kind"
        />
        <button
          type="button"
          onClick={() => setDate(addDays(date, -1))}
          aria-label="Previous day"
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:border-slate-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <DatePickerField className="w-44" value={date} onChange={(d) => setDate(startOfDay(d))} maxDate={maxDate} />
        <button
          type="button"
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= maxDate}
          aria-label="Next day"
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:border-slate-400 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDate(today)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          Today
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {board && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Column title="Booked" count={booked.length} accent="border-t-amber-400" empty="Nothing is booked this day.">
              {booked.map((u) => (
                <UnitBoardCard key={u.id} unit={u} from={from} to={to} showNow />
              ))}
            </Column>
            <Column title="Empty" count={empty.length} accent="border-t-emerald-500" empty="Every unit has a booking.">
              {empty.map((u) => (
                <UnitBoardCard key={u.id} unit={u} from={from} to={to} />
              ))}
            </Column>
          </div>
          {off > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              {off} {off === 1 ? 'unit is' : 'units are'} out of service and not shown.
            </p>
          )}
        </>
      )}
    </div>
  )
}
}