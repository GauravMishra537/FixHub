import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import KindDetail from './KindDetail'

/** Right-side panel for one kind. kind null = closed. */
export default function KindDrawer({ kind, onClose, onChanged }) {
  useEffect(() => {
    if (!kind) return undefined
    const key = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [kind, onClose])

  if (!kind) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Kind details</h2>
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/infra/catalog/${kind.id}`}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open full page
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <KindDetail key={kind.id} kind={kind} onChanged={onChanged} onRemoved={onClose} />
        </div>
      </aside>
    </>
  )
}