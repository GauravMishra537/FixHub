import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, Trash2 } from 'lucide-react'
import { notificationApi } from '../../api/notifications'
import { formatDateTime } from '../../utils/format'

const POLL_MS = 30000
const SIZE = 10

/** Bell in the navbar: unread number, and a box with the list, mark read and clear. */
export default function NotificationBell() {
  const navigate = useNavigate()
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)

  const refreshCount = useCallback(async () => {
    try {
      setCount(Number(await notificationApi.unreadCount()) || 0)
    } catch {
      // the bell keeps the old number
    }
  }, [])

  // number on the bell: now, then every 30 seconds while the tab is visible
  useEffect(() => {
    refreshCount()
    const id = setInterval(() => {
      if (!document.hidden) refreshCount()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [refreshCount])

  const load = useCallback(async (nextPage, replace) => {
    setLoading(true)
    try {
      const res = await notificationApi.list({ page: nextPage, size: SIZE })
      setItems((old) => (replace ? res.items : [...old, ...res.items]))
      setTotal(res.totalElements)
      setPage(nextPage)
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const down = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const key = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      load(0, true)
      refreshCount()
    }
    setOpen((o) => !o)
  }

  const openItem = async (n) => {
    setOpen(false)
    if (!n.read) {
      setItems((old) => old.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setCount((c) => Math.max(0, c - 1))
      try {
        await notificationApi.markRead(n.id)
      } catch {
        refreshCount()
      }
    }
    if (n.ticketId) navigate(`/tickets/${n.ticketId}`)
  }

  const markAll = async () => {
    try {
      await notificationApi.markAllRead()
      setItems((old) => old.map((x) => ({ ...x, read: true })))
      setCount(0)
    } catch (e) {
      setError(e.message || 'Action failed')
    }
  }

  const clear = async () => {
    try {
      await notificationApi.clearAll()
      setItems([])
      setTotal(0)
      setCount(0)
    } catch (e) {
      setError(e.message || 'Action failed')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-white transition-colors hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={markAll}
                disabled={count === 0}
                className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={items.length === 0}
                className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
            )}

            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-blue-500'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                    {n.message}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{formatDateTime(n.createdOn)}</span>
                </span>
              </button>
            ))}

            {loading && (
              <div className="flex justify-center py-4 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {!loading && items.length < total && (
              <button
                type="button"
                onClick={() => load(page + 1, false)}
                className="block w-full py-3 text-center text-sm font-medium text-blue-600 hover:bg-slate-50"
              >
                Show more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}