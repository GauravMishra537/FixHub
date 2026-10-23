import React, { useEffect, useMemo, useState } from 'react'
import { ticketCoreApi } from '../../api/ticketCore'
import useTicketFilters from '../../hooks/useTicketFilters'
import useBoardColumn from '../../hooks/useBoardColumn'
import BoardColumn from './BoardColumn'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import TicketFilterBar from '../tickets/TicketFilterBar'
import { MY_COLUMNS } from './boardColumns'

const PAGE = 10

// one column: owns its own paging, so every column loads and scrolls on its own
function Column({ column, base, storageKey, refresh, openId, onOpen }) {
  const key = JSON.stringify([base, column.params, refresh])
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } = useBoardColumn(
    (page) => ticketCoreApi.search({ ...base, ...column.params, page, size: PAGE }),
    key,
  )

  return (
    <BoardColumn
      title={column.title}
      color={column.color}
      count={total}
      storageKey={storageKey}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRetry={reload}
      emptyText={column.empty}
    >
      {items.map((t) => (
        <TicketCard key={t.id} ticket={t} selected={openId === t.id} onOpen={() => onOpen(t.id)} />
      ))}
    </BoardColumn>
  )
}

export default function UserBoard() {
  const { filters, activeCount, update, clear } = useTicketFilters()
  const [categories, setCategories] = useState([])
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the panel, so every column loads again
  const [refresh, setRefresh] = useState(0)

  // search text, category, priority, dates and sort apply to every column. status is fixed by the column
  const base = useMemo(
    () => ({
      q: filters.q,
      categoryId: filters.categoryId,
      priority: filters.priority,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      sortBy: filters.sortBy,
      direction: filters.direction,
    }),
    [filters.q, filters.categoryId, filters.priority, filters.createdFrom, filters.createdTo, filters.sortBy, filters.direction],
  )

  useEffect(() => {
    ticketCoreApi.categoryCounts('ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [refresh])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <TicketFilterBar
        title="My board"
        filters={filters}
        update={update}
        clear={clear}
        activeCount={activeCount}
        categories={categories}
        showStatus={false}
        showSort
      />

      <div className="flex items-start gap-4 overflow-x-auto p-4">
        {MY_COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            base={base}
            storageKey={`board.user.mine.${column.id}`}
            refresh={refresh}
            openId={openId}
            onOpen={setOpenId}
          />
        ))}
      </div>

      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setRefresh((r) => r + 1)}
      />
    </section>
  )
}