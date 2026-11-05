import React, { useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import CategoryDetail from './CategoryDetail'

/** Right-side panel for one category. category null = closed. A sub-category has a back arrow to its group. */
export default function CategoryDrawer({ category, subs, departments, onClose, onChanged, onOpen }) {
  useEffect(() => {
    if (!category) return undefined
    const key = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [category, onClose])

  if (!category) return null

  const isGroup = category.parentId == null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2">
            {!isGroup && (
              <button
                type="button"
                onClick={() => onOpen?.(category.parentId)}
                aria-label="Back to the category"
                title="Back to the category"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-semibold text-slate-900">{isGroup ? 'Category details' : 'Sub-category details'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <CategoryDetail
            key={category.id}
            category={category}
            subs={subs}
            departments={departments}
            onChanged={onChanged}
            onRemoved={onClose}
            onOpen={onOpen}
          />
        </div>
      </aside>
    </>
  )
}