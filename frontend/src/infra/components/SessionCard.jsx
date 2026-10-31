import React, { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { infraApi } from '../../api/infra'
import DateTimeRange from './DateTimeRange'
import UnitPicker from './UnitPicker'
import { isValidSession, needsLongReason, toRange } from '../utils/time'

/**
 * One session: when, which unit, and a reason when one is needed.
 * It asks the server for free units itself whenever the time or the headcount changes.
 * onPatch(objectOrFunction) updates this session in the form.
 */
export default function SessionCard({ index, session, typeId, headcount, maxMinutes, onPatch, onRemove, canRemove }) {
  const s = session

  useEffect(() => {
    if (!(headcount >= 1) || !isValidSession(s)) {
      onPatch({ avail: null, loading: false, error: '', unitId: null })
      return undefined
    }
    const { start, end } = toRange(s)
    let cancelled = false
    onPatch({ loading: true })
    // wait a little, so a quick run of clicks asks the server once
    const timer = setTimeout(async () => {
      try {
        const avail = await infraApi.availability({
          infraTypeId: typeId,
          start,
          end,
          headcount,
          includeBigger: s.includeBigger,
        })
        if (cancelled) return
        onPatch((prev) => ({
          avail,
          loading: false,
          error: '',
          // keep the pick when that unit is still free, take the only one when just one is free
          unitId: avail.units.some((u) => u.id === prev.unitId)
            ? prev.unitId
            : avail.units.length === 1
              ? avail.units[0].id
              : null,
        }))
      } catch (e) {
        if (!cancelled) onPatch({ avail: null, loading: false, error: e.message || 'Could not check', unitId: null })
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId, headcount, s.date?.getTime(), s.startMin, s.endMin, s.allDay, s.includeBigger])

  const unit = s.avail?.units.find((u) => u.id === s.unitId)
  const bigger = !!unit?.oversize
  const reasonLabel = bigger
    ? 'Why do you need a bigger room?'
    : s.allDay
      ? 'Why all day?'
      : 'Why so long?'
  const needsReason = needsLongReason(s, maxMinutes) || bigger

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Session {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>

      <DateTimeRange
        value={s}
        maxMinutes={maxMinutes}
        onChange={(n) =>
          onPatch({ date: n.date, startMin: n.startMin, endMin: n.endMin, allDay: n.allDay, includeBigger: false })
        }
      />

      <div className="mt-4">
        <UnitPicker
          avail={s.avail}
          loading={s.loading}
          error={s.error}
          value={s.unitId}
          onPick={(id) => onPatch({ unitId: id })}
          onShowBigger={() => onPatch({ includeBigger: true })}
        />
      </div>

      {needsReason && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">{reasonLabel}</label>
          <textarea
            rows={2}
            maxLength={500}
            value={s.reason}
            onChange={(e) => onPatch({ reason: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}