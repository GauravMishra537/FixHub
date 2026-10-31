import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { infraApi } from '../../api/infra'
import KindForm from './KindForm'
import UnitForm from './UnitForm'
import { fmtDuration } from '../utils/time'

const SMALL =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50'

// "Remove X? ..." with Yes and Back, inside the page
function Confirm({ text, busy, onYes, onNo }) {
  return (
    <div className="mt-2 rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs text-slate-500">{text}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onYes}
          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Yes, remove
        </button>
        <button type="button" disabled={busy} onClick={onNo} className={SMALL}>
          Back
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

/**
 * Everything about one kind: details, edit, hide, remove, and its units.
 * onChanged(): reload the kinds list behind it. onRemoved(): the kind was removed, close this view.
 * Give it key={kind.id} so a new kind starts clean.
 */
export default function KindDetail({ kind, onChanged, onRemoved }) {
  const [editing, setEditing] = useState(false)
  const [units, setUnits] = useState(null)
  const [addingUnit, setAddingUnit] = useState(false)
  const [editUnit, setEditUnit] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'type' | 'unit', id }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadUnits = useCallback(async () => {
    try {
      setUnits(await infraApi.units(kind.id))
    } catch (e) {
      setError(e.message || 'Could not load units')
    }
  }, [kind.id])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  // one place for busy, error and reload
  const run = async (fn, reloadUnits = false) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      if (reloadUnits) await loadUnits()
      await onChanged?.()
      return true
    } catch (e) {
      setError(e.message || 'Action failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  // update replaces the whole kind, so send every field
  const kindBody = (over = {}) => ({
    name: kind.name,
    description: kind.description || '',
    icon: kind.icon || '',
    maxMinutes: kind.maxMinutes,
    sortOrder: kind.sortOrder,
    active: kind.active,
    ...over,
  })

  const unitBody = (u, over = {}) => ({
    name: u.name,
    capacity: u.capacity,
    location: u.location || '',
    note: u.note || '',
    status: u.status,
    ...over,
  })

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold ${kind.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
              {kind.name}
            </h2>
            {!kind.active && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Hidden</span>
            )}
          </div>
          {kind.description && <div className="mt-0.5 text-sm text-slate-500">{kind.description}</div>}
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className={`${SMALL} inline-flex items-center`}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => infraApi.updateType(kind.id, kindBody({ active: !kind.active })))}
              className={SMALL}
            >
              {kind.active ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              disabled={kind.unitCount > 0}
              title={kind.unitCount > 0 ? 'Remove its units first' : ''}
              onClick={() => setConfirm({ kind: 'type', id: kind.id })}
              className={`${SMALL} inline-flex items-center`}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {editing && (
        <div className="mt-3">
          <KindForm
            initial={kind}
            busy={busy}
            onCancel={() => setEditing(false)}
            onSave={async (body) => {
              if (await run(() => infraApi.updateType(kind.id, body))) setEditing(false)
            }}
          />
        </div>
      )}

      {confirm?.kind === 'type' && (
        <Confirm
          text={`Remove "${kind.name}"? It has no units. Old bookings keep their history.`}
          busy={busy}
          onNo={() => setConfirm(null)}
          onYes={async () => {
            if (await run(() => infraApi.deleteType(kind.id))) onRemoved?.()
          }}
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Units" value={kind.unitCount} />
        <Stat label="In service" value={kind.activeUnitCount} />
        <Stat label="Largest" value={kind.maxCapacity ? `${kind.maxCapacity} people` : '-'} />
        <Stat label="No-reason limit" value={fmtDuration(kind.maxMinutes)} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Units{units ? ` (${units.length})` : ''}</h3>
        {!addingUnit && (
          <button type="button" onClick={() => setAddingUnit(true)} className={`${SMALL} inline-flex items-center`}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add a unit
          </button>
        )}
      </div>

      {addingUnit && (
        <div className="mt-2">
          <UnitForm
            busy={busy}
            onCancel={() => setAddingUnit(false)}
            onSave={async (body) => {
              if (await run(() => infraApi.createUnit({ ...body, infraTypeId: kind.id }), true)) {
                setAddingUnit(false)
              }
            }}
          />
        </div>
      )}

      {!units && !error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      )}

      {units && units.length === 0 && <p className="py-3 text-sm text-slate-400">No units yet.</p>}

      {units && units.length > 0 && (
        <ul className="mt-1 divide-y divide-slate-100">
          {units.map((u) => (
            <li key={u.id} className="py-3">
              {editUnit === u.id ? (
                <UnitForm
                  initial={u}
                  busy={busy}
                  onCancel={() => setEditUnit(null)}
                  onSave={async (body) => {
                    if (await run(() => infraApi.updateUnit(u.id, { ...body, status: u.status }), true)) {
                      setEditUnit(null)
                    }
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          u.status === 'ACTIVE' ? 'text-slate-900' : 'text-slate-400 line-through'
                        }`}
                      >
                        {u.name}
                      </span>
                      <span className="text-xs text-slate-500">{u.capacity} seats</span>
                      {u.status !== 'ACTIVE' && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Switched off
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {[u.location, u.note].filter(Boolean).join(', ') || 'No location'}
                    </div>
                    {u.upcomingBookings > 0 && (
                      <div className="text-xs text-amber-700">
                        {u.upcomingBookings} upcoming {u.upcomingBookings === 1 ? 'session' : 'sessions'}. They stay
                        booked if you switch this unit off.
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditUnit(u.id)} className={SMALL}>
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            infraApi.updateUnit(
                              u.id,
                              unitBody(u, { status: u.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE' }),
                            ),
                          true,
                        )
                      }
                      className={SMALL}
                    >
                      {u.status === 'ACTIVE' ? 'Switch off' : 'Switch on'}
                    </button>
                    <button type="button" onClick={() => setConfirm({ kind: 'unit', id: u.id })} className={SMALL}>
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {confirm?.kind === 'unit' && confirm.id === u.id && (
                <Confirm
                  text={`Remove "${u.name}"? It stops showing everywhere. A unit with upcoming sessions cannot be removed.`}
                  busy={busy}
                  onNo={() => setConfirm(null)}
                  onYes={async () => {
                    if (await run(() => infraApi.deleteUnit(u.id), true)) setConfirm(null)
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}