import React from 'react'
import { Power } from 'lucide-react'

/** Red power icon while the item is active, green power icon while it is not. */
export default function ToggleStatusButton({ active, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={active ? 'Deactivate' : 'Activate'}
      className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors disabled:opacity-50 ${
        active
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      <Power className="h-4 w-4" />
    </button>
  )
}
