import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { commentApi } from '../../api/comments'
import { formatDateTime } from '../../utils/format'

const MAX = 2000

/** The comment thread of one ticket, oldest first, with a box to write a new one. */
export default function TicketComments({ ticketId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems((await commentApi.list(ticketId)) || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load comments')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const post = async () => {
    const body = text.trim()
    if (!body) return
    setBusy(true)
    setError('')
    try {
      await commentApi.add(ticketId, body)
      setText('')
      await load()
    } catch (e) {
      setError(e.message || 'Could not post the comment')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c) => {
    if (!window.confirm('Delete this comment?')) return
    setError('')
    try {
      await commentApi.remove(ticketId, c.id)
      await load()
    } catch (e) {
      setError(e.message || 'Could not delete the comment')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">
        Comments{items.length > 0 ? ` (${items.length})` : ''}
      </h2>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No comments yet.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900">{c.authorName}</span>
                  <span className="ml-2 text-xs text-slate-400">{formatDateTime(c.createdOn)}</span>
                </div>
                {c.canDelete && (
                  <button
                    type="button"
                    title="Delete comment"
                    onClick={() => remove(c)}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <textarea
        rows={3}
        maxLength={MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {text.length}/{MAX}
        </span>
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={post}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Post comment
        </button>
      </div>
    </div>
  )
}