import React, { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { orgApi } from '../../api/org'
import Alert from '../common/Alert'

const FIELD =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function ContactForm({ profile, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '')
  const [workLocation, setWorkLocation] = useState(profile.workLocation || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const save = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setSaving(true)
    try {
      await orgApi.updateMyProfile({ phoneNumber, workLocation })
      setEditing(false)
      setMessage({ type: 'success', text: 'Details saved' })
      await onSaved()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save' })
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="mt-4">
        {message.text && <Alert type={message.type}>{message.text}</Alert>}
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Pencil className="w-4 h-4 mr-1.5" />
          Edit phone and work location
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-3">
      {message.text && <Alert type={message.type}>{message.text}</Alert>}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
        <input
          className={FIELD}
          value={phoneNumber}
          maxLength={20}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g. 9876543210"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Work location</label>
        <input
          className={FIELD}
          value={workLocation}
          maxLength={100}
          onChange={(e) => setWorkLocation(e.target.value)}
          placeholder="e.g. Ahmedabad office, 3rd floor"
        />
      </div>
      <div className="flex gap-2">
        <button
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}