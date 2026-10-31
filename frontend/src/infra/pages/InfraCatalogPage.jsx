import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { infraApi } from '../../api/infra'
import KindDrawer from '../components/KindDrawer'
import KindForm from '../components/KindForm'
import { infraIcon } from '../utils/icons'
import { fmtDuration } from '../utils/time'

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'

/** Admin: every kind in a table. A row opens the right panel with its details and units. */
export default function InfraCatalogPage() {
  const [kinds, setKinds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      setKinds((await infraApi.adminTypes()) || [])
    } catch (e) {
      setError(e.message || 'Could not load the catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async (body) => {
    setBusy(true)
    setError('')
    try {
      await infraApi.createType(body)
      setAdding(false)
      await load()
    } catch (e) {
      setError(e.message || 'Could not add')
    } finally {
      setBusy(false)
    }
  }

  const opened = kinds.find((k) => k.id === openId) || null

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Infra catalog</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Kinds and their units. Click a row to edit, hide, or manage its units.
            </p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" /> Add a kind
            </button>
          )}
        </div>

        {adding && (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">New kind</div>
            <KindForm busy={busy} onSave={create} onCancel={() => setAdding(false)} />
          </div>
        )}

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>Kind</th>
                <th className={TH}>Units</th>
                <th className={TH}>Largest</th>
                <th className={TH}>No-reason limit</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading...</td>
                </tr>
              )}
              {!loading && kinds.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No kinds yet. Add one to start.</td>
                </tr>
              )}
              {kinds.map((k) => {
                const Icon = infraIcon(k.icon)
                return (
                  <tr
                    key={k.id}
                    tabIndex={0}
                    onClick={() => setOpenId(k.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setOpenId(k.id)}
                    className={`cursor-pointer hover:bg-slate-50 ${k.id === openId ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={`block font-medium ${k.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                            {k.name}
                          </span>
                          {k.description && <span className="block truncate text-xs text-slate-500">{k.description}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {k.activeUnitCount} / {k.unitCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {k.maxCapacity ? `${k.maxCapacity} people` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{fmtDuration(k.maxMinutes)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          k.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {k.active ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <KindDrawer kind={opened} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  )
}