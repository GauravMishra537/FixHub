import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ticketCoreApi } from '../api/ticketCore'
import CategoryCombobox from '../components/tickets/CategoryCombobox'

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Title is required')
    if (category.trim().length < 2) return setError('Category is required (at least 2 characters)')

    setSaving(true)
    try {
      const created = await ticketCoreApi.create({
        type: 'ISSUE',
        title: title.trim(),
        description: description.trim(),
        categoryName: category.trim(),
        priority,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      })
      navigate(`/tickets/${created.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Raise an issue</h1>
        <p className="mb-5 text-sm text-slate-500">Describe the problem. Everyone in the office can see it unless you mark it private.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary, e.g. Tube light not working"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <CategoryCombobox value={category} onChange={setCategory} type="ISSUE" />
            <p className="mt-1 text-xs text-slate-400">Pick a suggestion or type a new one, e.g. Electrical, Plumbing, Network.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={5}
              value={description}
              maxLength={5000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where, since when, anything that helps"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private (only me, the assignee and admin can see it)
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit ticket'}
            </button>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}