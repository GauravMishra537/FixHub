import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export const VIEWS = ['MINE', 'PENDING', 'RESOLVED', 'TOTAL']
export const SORT_FIELDS = ['createdOn', 'updatedOn', 'ticketNo', 'title', 'status', 'priority']
export const PAGE_SIZES = [5, 10, 20, 50]

export const DEFAULT_FILTERS = {
  view: 'MINE',
  q: '',
  status: [],
  categoryId: '',
  priority: '',
  createdFrom: '',
  createdTo: '',
  sortBy: 'createdOn',
  direction: 'desc',
  page: 0,
  size: 10,
}

// URL -> filters. anything unknown or broken falls back to the default
function readFilters(sp) {
  const view = sp.get('view')
  const sortBy = sp.get('sortBy')
  const direction = sp.get('direction')
  const size = Number(sp.get('size'))
  const page = Number(sp.get('page'))

  return {
    view: VIEWS.includes(view) ? view : DEFAULT_FILTERS.view,
    q: sp.get('q') || '',
    status: sp.getAll('status'),
    categoryId: sp.get('categoryId') || '',
    priority: sp.get('priority') || '',
    createdFrom: sp.get('createdFrom') || '',
    createdTo: sp.get('createdTo') || '',
    sortBy: SORT_FIELDS.includes(sortBy) ? sortBy : DEFAULT_FILTERS.sortBy,
    direction: direction === 'asc' || direction === 'desc' ? direction : DEFAULT_FILTERS.direction,
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_FILTERS.size,
  }
}

// filters -> URL. only values that differ from the default are written, so the link stays short
function writeFilters(filters) {
  const sp = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v))
    } else if (value !== '' && value !== DEFAULT_FILTERS[key]) {
      sp.set(key, value)
    }
  })
  return sp
}

// filters -> request parameters of GET /api/tickets
export function toApiParams(filters) {
  const { view, ...rest } = filters
  return {
    ...rest,
    // dashboard boxes: My Tickets, Pending and Resolved are the user's own tickets. All Tickets is not
    mineOnly: view === 'TOTAL' ? undefined : true,
    group: view === 'PENDING' ? 'PENDING' : view === 'RESOLVED' ? 'RESOLVED' : undefined,
  }
}

// how many filters are on, for the "Clear (3)" button. view, sort and paging do not count
export function activeFilterCount(filters) {
  let count = 0
  if (filters.q) count += 1
  if (filters.status.length > 0) count += 1
  if (filters.categoryId) count += 1
  if (filters.priority) count += 1
  if (filters.createdFrom || filters.createdTo) count += 1
  return count
}

export default function useTicketFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => readFilters(searchParams), [searchParams])

  /**
   * patch: the keys to change. any change except page itself goes back to page 0.
   * options.replace: true overwrites the current history entry (typing in the search box)
   */
  const update = useCallback(
    (patch, options = {}) => {
      const next = { ...filters, ...patch }
      if (!('page' in patch)) next.page = 0
      setSearchParams(writeFilters(next), { replace: Boolean(options.replace) })
    },
    [filters, setSearchParams],
  )

  // drop every filter. view, sort and page size stay as they are
  const clear = useCallback(() => {
    update({
      q: '',
      status: [],
      categoryId: '',
      priority: '',
      createdFrom: '',
      createdTo: '',
    })
  }, [update])

  // click on a column header: same column flips the direction, a new column starts descending
  const sortBy = useCallback(
    (field) => {
      if (filters.sortBy === field) {
        update({ direction: filters.direction === 'asc' ? 'desc' : 'asc' })
      } else {
        update({ sortBy: field, direction: field === 'title' || field === 'ticketNo' ? 'asc' : 'desc' })
      }
    },
    [filters.sortBy, filters.direction, update],
  )

  return {
    filters,
    apiParams: useMemo(() => toApiParams(filters), [filters]),
    activeCount: activeFilterCount(filters),
    update,
    clear,
    sortBy,
  }
}