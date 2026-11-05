import React from 'react'
import { Loader2 } from 'lucide-react'

export const SMALL =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50'

export const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none'

export function ErrorBox({ text }) {
  if (!text) return null
  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{text}</div>
  )
}

// "Remove X? ..." with Yes and Back, inside the page
export function Confirm({ text, busy, onYes, onNo }) {
  return (
    <div className="mt-2 rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs text-slate-500">{text}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onYes}
          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Yes, remove
        </button>
        <button type="button" disabled={busy} onClick={onNo} className={SMALL}>
          Back
        </button>
      </div>
    </div>
  )
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}