import React, { useCallback, useEffect, useState } from 'react'
import { Inbox, Loader2 } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import { resourcesApi } from '../../api/resources'
import { useAuth } from '../../context/AuthContext'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import ApprovalCard from '../../resources/components/ApprovalCard'

const SIZE = 10

const SUB = 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400'

/**
 * My queue. First the resource requests waiting for my approval (Approve or Reject on the card),
 * then the tickets routed to my department that nobody has taken yet. Oldest first.
 */
export default function DepartmentQueue() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [approvals, setApprovals] = useState([])
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

  const loadApprovals = useCallback(async () => {
    try {
      setApprovals((await resourcesApi.approvals()) || [])
    } catch {
      setApprovals([])
    }
  }, [])

  // after a decision, a claim, or any change in a panel: both lists and the navbar badge
  const refresh = useCallback(async () => {
    await Promise.all([load(0, true), loadApprovals()])
    window.dispatchEvent(new Event('tickets:changed'))
  }, [load, loadApprovals])

  useEffect(() => {
    if (isAdmin) return undefined
    load(0, true)
    loadApprovals()
    // a ticket changed somewhere else on the page (the right panel, the stats row)
    const again = () => {
      load(0, true)
      loadApprovals()
    }
    window.addEventListener('tickets:changed', again)
    return () => window.removeEventListener('tickets:changed', again)
  }, [isAdmin, load, loadApprovals])

  // admin has the admin board
  if (isAdmin) return null

  const count = total + approvals.length
  const nothing = !loading && !error && items.length === 0 && approvals.length === 0

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center text-lg font-semibold text-slate-900">
          <Inbox className="mr-2 h-5 w-5 text-slate-500" /> My queue
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
      </div>

      <div className="space-y-4 p-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {nothing && <p className="py-6 text-center text-sm text-slate-400">Nothing is waiting for you.</p>}

        {approvals.length > 0 && (
          <div>
            <div className={SUB}>Resource requests to approve ({approvals.length})</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {approvals.map((r) => (
                <ApprovalCard key={r.ticketId} row={r} onOpen={setOpenId} onDone={refresh} />
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div>
            <div className={SUB}>Waiting for your department ({total})</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {items.map((t) => (
                <TicketCard key={t.id} ticket={t} selected={openId === t.id} onOpen={() => setOpenId(t.id)} />
              ))}
            </div>
          </div>
        )}

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

      <TicketDrawer ticketId={openId} onClose={() => setOpenId(null)} onChanged={refresh} />
    </section>
  )
}