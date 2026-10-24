import React from 'react'
import { Loader2 } from 'lucide-react'

export default function EditBar({ dirty, saving, canSave = true, error, onSave, onCancel }) {
  if (!dirty) return null
  return (
    <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <span className={`text-sm ${error ? 'text-red-600' : 'text-slate-500'}`}>
        {error || 'You have unsaved changes'}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </div>
  )
}