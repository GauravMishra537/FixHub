import React, { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { infraApi } from '../../api/infra'
import DateTimeRange from './DateTimeRange'
import UnitPicker from './UnitPicker'
import { isValidSession, needsLongReason, toRange } from '../utils/time'

/**
 * One session in the booking form: when, which free unit, and a reason when one is needed.
 * session: { key, date, startMin, endMin, allDay, reason, unitId, includeBigger, avail, loading, error }
 * onPatch(change): change is an object, or a function (session) => object. Updates this session only.
 * The free-unit search runs again whenever the time, the headcount or "show bigger" changes.
 */
export default function SessionCard({
  index,
  session,
  typeId,
  headcount,
  maxMinutes,
  canRemove,
  onPatch,
  onRemove,
}) {
  // the parent makes a new onPatch every render. keep the latest one here so the search effect does not loop
  const patchRef = useRef(onPatch)
  patchRef.current = onPatch

  const { date, startMin, endMin, allDay, includeBigger } = session
  const searchKey = `${date.getTime()}|${startMin}|${endMin}|${allDay}|${headcount}|${includeBigger}|${typeId}`

  useEffect(() => {
    if (headcount < 1 || !isValidSession(session)) {
      patchRef.current({ avail: null, unitId: null, loading: false, error: '' })
      return undefined
    }
    const { start, end } = toRange(session)
    if (start < new Date()) {
      patchRef.current({ avail: null, unitId: null, loading: false, error: 'Start time is in the past' })
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(() => {
      patchRef.current({ loading: true, error: '' })
      infraApi
        .availability({ infraTypeId: typeId, start, end, headcount, includeBigger })
        .then((avail) => {
          if (cancelled) return
          patchRef.current((s) => ({
            avail,
            loading: false,
            error: '',
            unitId: avail.units.some((u) => u.id === s.unitId) ? s.unitId : null,
          }))
        })
        .catch((e) => {
          if (cancelled) return
          patchRef.current({ avail: null, unitId: null, loading: false, error: e.message || 'Could not check' })
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  const pickedUnit = session.avail?.units.find((u) => u.id === session.unitId)
  const reasonRequired = needsLongReason(session, maxMinutes) || Boolean(pickedUnit?.oversize)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Session {index + 1}</div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center text-xs font-medium text-red-600 hover:underline"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>

      <DateTimeRange
        value={{ date, startMin, endMin, allDay }}
        maxMinutes={maxMinutes}
        onChange={(v) => onPatch(v)}
      />

      <div className="mt-3">
        <UnitPicker
          avail={session.avail}
          loading={session.loading}
          error={session.error}
          value={session.unitId}
          onPick={(id) => onPatch({ unitId: id })}
          onShowBigger={() => onPatch({ includeBigger: true })}
        />
      </div>

      {reasonRequired && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Reason (required)</label>
          <input
            type="text"
            maxLength={500}
            value={session.reason}
            onChange={(e) => onPatch({ reason: e.target.value })}
            placeholder="Why this long, all day, or a bigger unit?"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
