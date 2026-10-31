import React from 'react'
import DatePickerField from './DatePickerField'
import TimeSelect from './TimeSelect'
import {
  DAY, LAST_START, MAX_DAYS_AHEAD, STEP,
  addDays, durationMinutes, firstSlot, fmtDuration, needsLongReason, startOfDay,
} from '../utils/time'

/**
 * One session row, Google Calendar style: [date] [start] to [end] [All day].
 * value: { date, startMin, endMin, allDay }. onChange(newValue).
 * maxMinutes: the kind's limit. Over it, or All day, shows a hint that a reason is needed.
 * Turning All day on hides the times.
 */
export default function DateTimeRange({ value, onChange, maxMinutes }) {
  const now = new Date()
  const minDate = startOfDay(now)
  const maxDate = addDays(minDate, MAX_DAYS_AHEAD)

  const first = firstSlot(value.date, now)

  // a new day: keep the times, but not earlier than now when the day is today
  const setDate = (d) => {
    const f = firstSlot(d, now)
    const startMin = Math.min(Math.max(value.startMin, f), LAST_START)
    let endMin = value.endMin
    if (endMin <= startMin) endMin = Math.min(startMin + 60, DAY)
    onChange({ ...value, date: d, startMin, endMin })
  }

  // moving the start moves the end too, the length stays
  const setStart = (s) => {
    const length = value.endMin - value.startMin
    let endMin = Math.min(s + length, DAY)
    if (endMin <= s) endMin = s + STEP
    onChange({ ...value, startMin: s, endMin })
  }

  const longReason = needsLongReason(value, maxMinutes)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <DatePickerField
          className="w-44"
          value={value.date}
          onChange={setDate}
          minDate={minDate}
          maxDate={maxDate}
        />

        {!value.allDay && (
          <>
            <TimeSelect className="w-32" value={value.startMin} from={first} to={LAST_START} onChange={setStart} />
            <span className="text-sm text-slate-500">to</span>
            <TimeSelect
              className="w-44"
              value={value.endMin}
              from={value.startMin + STEP}
              to={DAY}
              startMin={value.startMin}
              onChange={(e) => onChange({ ...value, endMin: e })}
            />
          </>
        )}

        <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.allDay}
            onChange={(e) => onChange({ ...value, allDay: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          All day
        </label>
      </div>

      {longReason && (
        <p className="mt-1.5 text-xs text-amber-700">
          {value.allDay
            ? 'All day booking. A reason is required.'
            : `Longer than ${fmtDuration(maxMinutes)} (${fmtDuration(durationMinutes(value))} chosen). A reason is required.`}
        </p>
      )}
    </div>
  )
}