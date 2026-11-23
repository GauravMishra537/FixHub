import React, { useCallback, useEffect, useState } from 'react'
import { HandHelping, Loader2 } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'

/**
 * Employee box: claim the ticket, or take a waiting claim back. Shows nothing when neither applies.
 * topic: a topic request. The box says "I can help" and the first person to click gets it.
 */
export default function TicketClaimBox({ ticketId, refreshKey, onDone, topic = false }) {
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadState = useCallback(async () => {
    try {
      setState(await ticketCoreApi.claimState(ticketId))
    } catch {
      setState(null)
    }
  }, [ticketId])

  useEffect(() => {
    loadState()
  }, [loadState, refreshKey])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      const updated = await fn()
      await onDone(updated)
      await loadState()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  if (!state) return null
  const waiting = state.myClaim === 'PENDING'
  if (!state.canClaim && !waiting) return null

  const title = waiting
    ? 'Your claim is waiting for the admin'
    : topic
    ? 'You can help with this question'
    : 'Waiting for your department'

  const text = waiting
    ? 'You will get a notification when the admin decides.'
    : topic
    ? 'You know this topic. Click I can help and it is yours. The first person to click gets it.'
    : state.requiresApproval
    ? 'Ask to take this ticket. An admin approves one person.'
    : 'Take this ticket. The first person to claim it gets it.'

  const button = topic ? 'I can help' : state.requiresApproval ? 'Ask to take it' : 'Claim ticket'

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center text-sm font-semibold text-slate-900">
        <HandHelping className="mr-2 h-4 w-4 text-slate-500" />
        {title}
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{text}</p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3">
        {waiting ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => ticketCoreApi.withdrawClaim(ticketId))}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Withdraw claim
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => ticketCoreApi.claim(ticketId))}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {button}
          </button>
        )}
      </div>
    </div>
  )
}