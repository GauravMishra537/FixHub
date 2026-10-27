import React, { useEffect, useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import { useAuth } from '../../context/AuthContext'
import useTicketFilters from '../../hooks/useTicketFilters'
import useBoardColumn from '../../hooks/useBoardColumn'
import BoardColumn from './BoardColumn'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import TicketFilterBar from '../tickets/TicketFilterBar'
import FilterMenu from '../common/FilterMenu'
import { MY_VIEWS, STATUS_OPTIONS } from './boardColumns'

const PAGE = 10

const EMPTY = {
  items: [],
  total: 0,
  loading: false,
  loadingMore: false,
  error: '',
  hasMore: false,
  loadMore: () => {},
  reload: () => {},
}

// last chosen view is remembered per person. blocked storage must never break the board
const viewKey = (userId) => `fixhub.board.view.${userId}`

const readView = (userId) => {
  try {
    const v = localStorage.getItem(viewKey(userId))
    return MY_VIEWS.some((x) => x.id === v) ? v : MY_VIEWS[0].id
  } catch {
    return MY_VIEWS[0].id
  }
}

const writeView = (userId, value) => {
  try {
    localStorage.setItem(viewKey(userId), value)
  } catch {
    /* ignore */
  }
}

// one column: owns its own paging, so every column loads and scrolls on its own
function Column({ column, base, statusFilter, storageKey, refresh, openId, onOpen }) {
  // a picked status narrows the column. a status that does not belong here leaves the column empty
  const statuses = statusFilter ? column.params.status.filter((s) => s === statusFilter) : column.params.status
  const none = statuses.length === 0

  const key = JSON.stringify([base, column.params, statuses, refresh])
  const col = useBoardColumn(
    (page) => ticketCoreApi.search({ ...base, ...column.params, status: statuses, page, size: PAGE }),
    key,
    !none,
  )
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } = none ? EMPTY : col

  return (
    <BoardColumn
      title={column.title}
      color={column.color}
      count={total ?? 0}
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
        <TicketCard
          key={t.id}
          ticket={t}
          selected={openId === t.id}
          onOpen={() => onOpen(t.id)}
          badge={column.badge || ''}
        />
      ))}
    </BoardColumn>
  )
}

export default function UserBoard() {
  const { user } = useAuth()
  const { filters, activeCount, update, clear } = useTicketFilters()
  const [view, setView] = useState(() => readView(user?.id))
  const [statusFilter, setStatusFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the panel, so every column loads again
  const [refresh, setRefresh] = useState(0)

  const current = MY_VIEWS.find((v) => v.id === view) || MY_VIEWS[0]

  // the user may arrive after the first render
  useEffect(() => {
    setView(readView(user?.id))
  }, [user?.id])

  const pickView = (id) => {
    setView(id)
    writeView(user?.id, id)
  }

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
        clear={() => {
          clear()
          setStatusFilter('')
        }}
        activeCount={activeCount + (statusFilter ? 1 : 0)}
        categories={categories}
        showStatus={false}
        showSort
        extra={
          <FilterMenu
            icon={Activity}
            label="Status"
            allLabel="All statuses"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        }
      />

      <div className="px-4 pt-4">
        <div role="tablist" className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {MY_VIEWS.map((v) => {
            const active = v.id === current.id
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pickView(v.id)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                  active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto p-4">
        {current.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            base={base}
            statusFilter={statusFilter}
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