import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads one board column page by page.
 *
 * fetchPage(pageNumber) must return { items, page, totalPages, totalElements }.
 * resetKey: when it changes (filters, view) the column starts again from page 0.
 * enabled:  false keeps the column idle.
 */
export default function useBoardColumn(fetchPage, resetKey, enabled = true) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // always call the newest fetchPage without restarting the effect on every render
  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage
  // an answer that arrives after a reset belongs to an old request and is dropped
  const token = useRef(0)

  const loadFirst = useCallback(async () => {
    const id = ++token.current
    setLoading(true)
    setError('')
    try {
      const result = await fetchRef.current(0)
      if (id !== token.current) return
      setItems(result.items || [])
      setTotal(result.totalElements ?? 0)
      setPage(result.page ?? 0)
      setTotalPages(result.totalPages ?? 0)
    } catch (e) {
      if (id !== token.current) return
      setError(e.message || 'Could not load')
      setItems([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      if (id === token.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) loadFirst()
  }, [resetKey, enabled, loadFirst])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || page + 1 >= totalPages) return
    const id = token.current
    setLoadingMore(true)
    try {
      const result = await fetchRef.current(page + 1)
      if (id !== token.current) return
      // a new ticket can push rows to the next page, so skip ids already shown
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id))
        return [...prev, ...(result.items || []).filter((i) => !seen.has(i.id))]
      })
      setPage(result.page ?? page + 1)
      setTotalPages(result.totalPages ?? totalPages)
      setTotal(result.totalElements ?? total)
    } catch (e) {
      if (id === token.current) setError(e.message || 'Could not load more')
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingMore, page, totalPages, total])

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: page + 1 < totalPages,
    loadMore,
    reload: loadFirst,
  }
}