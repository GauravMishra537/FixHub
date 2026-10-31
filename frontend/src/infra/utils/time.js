// date and time helpers for the booking form. all in the browser's own time zone.
export const STEP = 30 // minutes
export const MAX_DAYS_AHEAD = 30
export const DAY = 24 * 60

export const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// minutes since midnight -> "10:30 AM". 1440 shows "12:00 AM" (midnight at the end of the day)
export const fmtTime = (min) => {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const fmtDate = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export const fmtDuration = (mins) => {
  if (mins < 60) return `${mins} mins`
  const h = mins / 60
  return `${h} ${h === 1 ? 'hr' : 'hrs'}`
}

// first start time allowed on a day: 0 for a later day, the next slot after now for today
export const firstSlot = (date, now = new Date()) => {
  if (!sameDay(date, now)) return 0
  const mins = now.getHours() * 60 + now.getMinutes()
  return Math.ceil((mins + 1) / STEP) * STEP
}

// the last start time of a day is 11:30 PM
export const LAST_START = DAY - STEP

// today when a slot is left, else tomorrow
export const earliestDate = (now = new Date()) => {
  const today = startOfDay(now)
  return firstSlot(today, now) <= LAST_START ? today : addDays(today, 1)
}

// a fresh session row: first free slot, one hour long
export const newSession = (now = new Date()) => {
  const date = earliestDate(now)
  const startMin = firstSlot(date, now)
  return { date, startMin, endMin: Math.min(startMin + 60, DAY), allDay: false }
}

// { date, startMin, endMin, allDay } -> real start and end dates
export const toRange = ({ date, startMin, endMin, allDay }) => {
  const base = startOfDay(date)
  const start = new Date(base)
  const end = new Date(base)
  start.setMinutes(allDay ? 0 : startMin)
  end.setMinutes(allDay ? DAY : endMin)
  return { start, end }
}

export const durationMinutes = (v) => (v.allDay ? DAY : v.endMin - v.startMin)

export const isValidSession = (v) => !!v.date && (v.allDay || v.endMin > v.startMin)

// all day, or longer than the kind's limit: the form must ask for a reason
export const needsLongReason = (v, maxMinutes) =>
  v.allDay || (maxMinutes != null && durationMinutes(v) > maxMinutes)