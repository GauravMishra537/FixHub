import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Loader2, Search } from 'lucide-react'
import { topicsApi } from '../../api/topics'
import SelectMenu from '../../components/common/SelectMenu'
import { PRIORITY_OPTIONS } from '../../utils/options'

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
// a search box appears when the list is long
const SEARCH_FROM = 12

/** Ask for help on one topic. People who know it are told. One ticket per problem. */
export default function TopicRequestPage() {
  const navigate = useNavigate()

  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [topicId, setTopicId] = useState(null) // the one chosen skill id
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [isPrivate, setIsPrivate] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    topicsApi
      .skills()
      .then((list) => setSkills(list || []))
      .catch((e) => setError(e.message || 'Could not load topics'))
      .finally(() => setLoading(false))
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : skills
  }, [skills, query])

  // nobody holds the chosen topic: an admin will choose a helper
  const nobody = topicId != null && (skills.find((s) => s.id === topicId)?.helperCount ?? 0) === 0

  // click the chosen chip again to clear it
  const toggle = (id) => setTopicId((current) => (current === id ? null : id))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (topicId == null) return setError('Pick a topic')
    if (!title.trim()) return setError('Give your question a title')
    if (!description.trim()) return setError('Describe your problem')
    setSaving(true)
    try {
      const created = await topicsApi.create({
        title: title.trim(),
        description: description.trim(),
        skillIds: [topicId],
        priority,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      })
      navigate(`/tickets/${created.ticketId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Topic request</h1>
        <p className="text-sm text-slate-500">
          Stuck on something? Pick the topic, describe the problem, and people who know it will help. Follow it in My
          Requests on your dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {skills.length === 0 ? (
          <p className="text-sm text-slate-500">No topics are available right now.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>

              {skills.length >= SEARCH_FROM && (
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search topics"
                    className={`${INPUT} pl-9`}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {shown.map((s) => {
                  const on = topicId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        on
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {s.name}
                    </button>
                  )
                })}
                {shown.length === 0 && <p className="text-sm text-slate-400">No topic matches your search.</p>}
              </div>

              {nobody && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  No one has this skill yet. An admin will pick a helper for you.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input
                value={title}
                maxLength={MAX_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Describe your problem</label>
              <textarea
                rows={6}
                maxLength={MAX_DESCRIPTION}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={INPUT}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>You can attach screenshots or files on the next page.</span>
                <span>
                  {description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                <SelectMenu value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                Private (only me, the helper and admin can see it)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Sending...' : 'Send request'}
              </button>
              <Link
                to="/"
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}