import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { infraApi } from '../../api/infra'
import SessionCard from '../components/SessionCard'
import {
  MAX_DAYS_AHEAD, addDays, isValidSession, needsLongReason, newSession, startOfDay, toRange,
} from '../utils/time'

const MAX_SESSIONS = 10

export default function BookingFormPage() {
  const { typeId } = useParams()
  const navigate = useNavigate()
  const counter = useRef(1)

  const [type, setType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [headcount, setHeadcount] = useState('')
  const [note, setNote] = useState('')
  const [sessions, setSessions] = useState(() => [blank(0, newSession())])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    infraApi
      .types()
      .then((list) => setType(list.find((t) => String(t.id) === String(typeId)) || null))
      .catch((e) => setError(e.message || 'Could not load'))
      .finally(() => setLoading(false))
  }, [typeId])

  const head = parseInt(headcount, 10) || 0

  const patch = (key, change) =>
    setSessions((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...(typeof change === 'function' ? change(s) : change) } : s)),
    )

  // a new headcount can change which room fits, so "show bigger rooms" starts again
  const changeHeadcount = (value) => {
    setHeadcount(value)
    setSessions((prev) => prev.map((s) => ({ ...s, includeBigger: false })))
  }

  // the next session starts on the day after the last one, same times (a client visit over several days)
  const addSession = () => {
    const last = sessions[sessions.length - 1]
    const maxDate = addDays(startOfDay(new Date()), MAX_DAYS_AHEAD)
    const nextDate = addDays(last.date, 1)
    const base = nextDate > maxDate ? newSession() : { ...last, date: nextDate }
    setSessions((prev) => [...prev, blank(counter.current++, base)])
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Title is required')
    if (head < 1) return setError('Enter how many people will attend')
    if (type.maxCapacity && head > type.maxCapacity) {
      return setError(`No ${type.name} holds ${head} people. The largest holds ${type.maxCapacity}`)
    }

    const body = []
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i]
      const at = `Session ${i + 1}: `
      if (!isValidSession(s)) return setError(`${at}end time must be after start time`)
      const { start, end } = toRange(s)
      if (start < new Date()) return setError(`${at}start time is in the past`)
      if (!s.unitId) return setError(`${at}pick a unit`)
      const unit = s.avail?.units.find((u) => u.id === s.unitId)
      if ((needsLongReason(s, type.maxMinutes) || unit?.oversize) && !s.reason.trim()) {
        return setError(`${at}a reason is required`)
      }
      body.push({
        infrastructureId: s.unitId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        allDay: s.allDay,
        reason: s.reason.trim(),
      })
    }

    setSaving(true)
    try {
      const created = await infraApi.book({
        infraTypeId: type.id,
        title: title.trim(),
        note: note.trim(),
        headcount: head,
        sessions: body,
      })
      navigate(`/tickets/${created.ticketId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }
  if (!type) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || 'This kind is not available.'}
        </div>
        <Link to="/infra" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Back to Infra</Link>
      </div>
    )
  }

  const anyChecking = sessions.some((s) => s.loading)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/infra" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Infra
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Book {type.name}</h1>
        <p className="mb-5 text-sm text-slate-500">
          An admin approves every booking. Add more sessions for a visit over several days.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client demo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">How many people?</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={headcount}
              onChange={(e) => changeHeadcount(e.target.value)}
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              You see the smallest unit that fits. Up to {type.maxCapacity} people in one {type.name}.
            </p>
          </div>

          <div className="space-y-3">
            {sessions.map((s, i) => (
              <SessionCard
                key={s.key}
                index={i}
                session={s}
                typeId={type.id}
                headcount={head}
                maxMinutes={type.maxMinutes}
                canRemove={sessions.length > 1}
                onPatch={(change) => patch(s.key, change)}
                onRemove={() => setSessions((prev) => prev.filter((x) => x.key !== s.key))}
              />
            ))}
            <button
              type="button"
              disabled={sessions.length >= MAX_SESSIONS}
              onClick={addSession}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {sessions.length >= MAX_SESSIONS ? `Up to ${MAX_SESSIONS} sessions` : 'Add another session'}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the admin should know"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || anyChecking}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Request booking'}
            </button>
            <Link
              to="/infra"
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// a session row in the form: the time, plus what the server answered and what the person picked
function blank(key, base) {
  return {
    key,
    date: base.date,
    startMin: base.startMin,
    endMin: base.endMin,
    allDay: base.allDay,
    reason: '',
    unitId: null,
    includeBigger: false,
    avail: null,
    loading: false,
    error: '',
  }
}