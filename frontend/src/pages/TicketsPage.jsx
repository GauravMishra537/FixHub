import React, { useEffect, useMemo, useState } from 'react'
import { ticketCoreApi } from '../api/ticketCore'
import useTicketFilters, { toApiParams } from '../hooks/useTicketFilters'
import TicketTable from '../components/tickets/TicketTable'
import TicketFilterBar from '../components/tickets/TicketFilterBar'
import TicketDrawer from '../components/tickets/TicketDrawer'

/**
 * Tickets as simple rows. A row click opens the side panel.
 * type: ISSUE, ROOM_BOOKING, RESOURCE_REQUEST or TOPIC_REQUEST. Leave it out for every type.
 * title: the heading in the filter bar.
 */
export default function TicketsPage({ type, title = 'All tickets' }) {
  const { filters, activeCount, update, clear, sortBy } = useTicketFilters()

  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the panel, so the rows load again
  const [refresh, setRefresh] = useState(0)

  // this page always looks at all visible tickets, never only "mine"
  const apiParams = useMemo(() => {
    const params = toApiParams({ ...filters, view: 'TOTAL' })
    return type ? { ...params, type } : params
  }, [filters, type])

  useEffect(() => {
    ticketCoreApi.categoryCounts(type || 'ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [type, refresh])

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
  }, [apiParams, refresh])

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TicketFilterBar
          title={title}
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
          onOpen={setOpenId}
          selectedId={openId}
          onPage={(page) => update({ page })}
          sortBy={filters.sortBy}
          direction={filters.direction}
          onSort={sortBy}
          size={filters.size}
          onSize={(size) => update({ size })}
        />
      </section>

      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setRefresh((r) => r + 1)}
      />
    </div>
  )
}