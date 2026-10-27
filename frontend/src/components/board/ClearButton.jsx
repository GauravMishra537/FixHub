import React from 'react'
import { X } from 'lucide-react'

/** Small X on a card. Removes it from the list. Nothing is deleted. */
export default function ClearButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      title="Remove from this list"
      aria-label="Remove from this list"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 ${className}`}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}