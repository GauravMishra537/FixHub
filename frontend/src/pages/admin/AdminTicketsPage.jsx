import React, { useEffect, useMemo, useState } from 'react'
import { ticketCoreApi } from '../../api/ticketCore'
import useTicketFilters, { toApiParams } from '../../hooks/useTicketFilters'
import TicketTable from '../../components/tickets/TicketTable'
import TicketFilterBar from '../../components/tickets/TicketFilterBar'

export default function AdminTicketsPage() {
  const { filters, activeCount, update, clear, sortBy } = useTicketFilters()

  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // admin always looks at every ticket, never only "mine"
  const apiParams = useMemo(() => toApiParams({ ...filters, view: 'TOTAL' }), [filters])

  useEffect(() => {
    ticketCoreApi.categoryCounts('ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ticketCoreApi
      .search(apiParams)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiParams])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tickets</h1>
        <p className="text-sm text-slate-500">
          Every ticket in the office, including private ones. Click a row to see details.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <TicketFilterBar
          filters={filters}
          update={update}
          clear={clear}
          activeCount={activeCount}
          categories={categories}
        />
        <TicketTable
          data={data}
          loading={loading}
          emptyText={activeCount > 0 ? 'No tickets match these filters.' : 'No tickets yet.'}
          onPage={(page) => update({ page })}
          sortBy={filters.sortBy}
          direction={filters.direction}
          onSort={sortBy}
          size={filters.size}
          onSize={(size) => update({ size })}
        />
      </section>
    </div>
  )
}