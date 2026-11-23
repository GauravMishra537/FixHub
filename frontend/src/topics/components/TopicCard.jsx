import React, { useCallback, useEffect, useState } from 'react'
import { BookOpen, ExternalLink, FileText, Link2, Loader2, Plus, Trash2, Video } from 'lucide-react'
import { topicsApi } from '../../api/topics'
import SelectMenu from '../../components/common/SelectMenu'
import { formatDateTime } from '../../utils/format'

const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none'

const KIND_OPTIONS = [
  { value: 'LINK', label: 'Link' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DOCUMENT', label: 'Document' },
]
const KIND_ICON = { LINK: Link2, VIDEO: Video, DOCUMENT: FileText }

const EMPTY = { title: '', url: '', kind: 'LINK' }

/**
 * Topic chips and the learning material (links) of a topic ticket.
 * canAdd: the helper or an admin, ticket not finished. locked: ticket finished, nothing changes.
 * Files and text explanations use Attachments and Comments below.
 */
export default function TopicCard({ ticketId, canAdd, locked, refreshKey }) {
  const [topics, setTopics] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([topicsApi.topicsOf(ticketId), topicsApi.links(ticketId)])
      setTopics(t || [])
      setLinks(l || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const add = async (e) => {
    e.preventDefault()
    setError('')
    const url = form.url.trim()
    if (!/^https?:\/\//i.test(url)) return setError('The link must start with http:// or https://')
    setBusy(true)
    try {
      await topicsApi.addLink(ticketId, { title: form.title.trim(), url, kind: form.kind })
      setForm(EMPTY)
      setAdding(false)
      await load()
    } catch (err) {
      setError(err.message || 'Could not add the link')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (link) => {
    if (!window.confirm(`Remove ${link.title}?`)) return
    setError('')
    try {
      await topicsApi.removeLink(ticketId, link.id)
      await load()
    } catch (err) {
      setError(err.message || 'Could not remove the link')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center font-semibold text-slate-900">
        <BookOpen className="mr-2 h-4 w-4 text-slate-500" />
        Topics and learning material
      </h2>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {t.name}
              </span>
            ))}
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Learning material{links.length > 0 ? ` (${links.length})` : ''}
          </div>

          {links.length === 0 ? (
            <p className="mb-3 text-sm text-slate-400">
              No links yet. The helper adds links here. Files go in Attachments, text in the explanation or comments.
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {links.map((l) => {
                const Icon = KIND_ICON[l.kind] || Link2
                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-medium text-blue-700 hover:underline"
                          title={l.url}
                        >
                          {l.title}
                        </a>
                        <div className="text-xs text-slate-400">
                          {l.addedByName} · {formatDateTime(l.createdOn)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {l.canDelete && !locked && (
                        <button
                          type="button"
                          title="Remove link"
                          onClick={() => remove(l)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {canAdd && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add link
            </button>
          )}

          {canAdd && adding && (
            <form onSubmit={add} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  autoFocus
                  value={form.url}
                  maxLength={1000}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className={`${INPUT} sm:col-span-2`}
                />
                <SelectMenu value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={KIND_OPTIONS} />
              </div>
              <input
                value={form.title}
                maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title (optional)"
                className={INPUT}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !form.url.trim()}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Add
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAdding(false)
                    setForm(EMPTY)
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}