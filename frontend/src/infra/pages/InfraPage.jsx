import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { infraApi } from '../../api/infra'
import { infraIcon } from '../utils/icons'

export default function InfraPage() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    infraApi
      .types()
      .then(setTypes)
      .catch((e) => setError(e.message || 'Could not load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl">
           <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Infra booking</h1>
          <p className="text-sm text-slate-500">
            Pick what you want to book. Every booking needs admin approval. Follow it in My Requests on your dashboard.
          </p>
        </div>
        <Link
          to="/infra/board"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          See who booked what
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => {
            const Icon = infraIcon(t.icon)
            const off = t.activeUnitCount === 0
            const card = (
              <div
                className={`flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition ${
                  off ? 'opacity-50' : 'hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                  {t.description && <span className="block text-xs text-slate-500">{t.description}</span>}
                  <span className="mt-1 block text-xs text-slate-400">
                    {off ? 'No unit available now' : `${t.activeUnitCount} units, up to ${t.maxCapacity} people`}
                  </span>
                </span>
              </div>
            )
            return off ? (
              <div key={t.id}>{card}</div>
            ) : (
              <Link key={t.id} to={`/infra/book/${t.id}`}>
                {card}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}