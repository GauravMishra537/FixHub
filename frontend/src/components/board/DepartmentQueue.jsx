import React, { useCallback, useEffect, useState } from 'react'
import { Inbox, Loader2 } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import { useAuth } from '../../context/AuthContext'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'

const SIZE = 10

/** Tickets routed to my department that nobody has taken yet. Oldest first. */
export default function DepartmentQueue() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async (nextPage, replace) => {
    setLoading(true)
    try {
      const res = await ticketCoreApi.departmentQueue({ page: nextPage, size: SIZE })
      setItems((old) => (replace ? res.items : [...old, ...res.items]))
      setTotal(res.totalElements)
      setPage(nextPage)
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load the queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) load(0, true)
  }, [isAdmin, load])

  // admin has the admin board
  if (isAdmin) return null

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center text-lg font-semibold text-slate-900">
          <Inbox className="mr-2 h-5 w-5 text-slate-500" /> Department queue
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{total}</span>
      </div>

      <div className="space-y-2 p-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Nothing is waiting for your department.</p>
        )}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <TicketCard key={t.id} ticket={t} selected={openId === t.id} onOpen={() => setOpenId(t.id)} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-3 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {!loading && items.length < total && (
          <button
            type="button"
            onClick={() => load(page + 1, false)}
            className="mx-auto block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Show more
          </button>
        )}
      </div>

      <TicketDrawer ticketId={openId} onClose={() => setOpenId(null)} onChanged={() => load(0, true)} />
    </section>
  )
}