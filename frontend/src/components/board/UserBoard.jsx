import React, { useEffect, useMemo, useState } from 'react'
import { ticketCoreApi } from '../../api/ticketCore'
import { useAuth } from '../../context/AuthContext'
import useTicketFilters from '../../hooks/useTicketFilters'
import useBoardColumn from '../../hooks/useBoardColumn'
import useDismissed from '../../hooks/useDismissed'
import BoardColumn from './BoardColumn'
import ClearButton from './ClearButton'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import TicketFilterBar from '../tickets/TicketFilterBar'
import { MY_COLUMNS } from './boardColumns'

const PAGE = 10

// one column: owns its own paging, so every column loads and scrolls on its own
function Column({ column, base, storageKey, refresh, openId, onOpen, dismissed, filtering }) {
  const key = JSON.stringify([base, column.params, refresh])
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } = useBoardColumn(
    (page) => ticketCoreApi.search({ ...base, ...column.params, page, size: PAGE }),
    key,
  )

  // only the Resolved column can be cleared. while searching or filtering, everything shows again
  const clearable = column.id === 'done'
  const hideOn = clearable && !filtering
  const visible = hideOn ? items.filter((t) => !dismissed.has(`t-${t.id}`)) : items
  const hiddenLoaded = items.length - visible.length

  // hidden cards use up page slots. when few are left on screen, load the next page
  useEffect(() => {
    if (hideOn && hiddenLoaded > 0 && visible.length < 3 && hasMore && !loading && !loadingMore) {
      loadMore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideOn, hiddenLoaded, visible.length, hasMore, loading, loadingMore])

  const cards = visible.map((t) => (
    <div key={t.id} className="relative min-w-0">
      <TicketCard ticket={t} selected={openId === t.id} onOpen={() => onOpen(t.id)} />
      {clearable && (
        <ClearButton className="absolute right-1.5 top-1.5" onClick={() => dismissed.dismiss(`t-${t.id}`)} />
      )}
    </div>
  ))

  return (
    <BoardColumn
      title={column.title}
      color={column.color}
      count={Math.max(0, (total ?? 0) - hiddenLoaded)}
      storageKey={storageKey}
      loading={loading}
      loadingMore={loadingMore}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRetry={reload}
      emptyText={column.empty}
    >
            {cards}
    </BoardColumn>
  )
}

export default function UserBoard() {
  const { user } = useAuth()
  const { filters, activeCount, update, clear } = useTicketFilters()
  const dismissed = useDismissed(user?.id, 'user')
  const [categories, setCategories] = useState([])
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the panel, so every column loads again
  const [refresh, setRefresh] = useState(0)

  const filtering = activeCount > 0 || Boolean(filters.q)

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

  // any panel on the page (department queue, claim box, status buttons) says "tickets changed":
  // load every column again
  useEffect(() => {
    const bump = () => setRefresh((r) => r + 1)
    window.addEventListener('tickets:changed', bump)
    return () => window.removeEventListener('tickets:changed', bump)
  }, [])

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
            dismissed={dismissed}
            filtering={filtering}
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