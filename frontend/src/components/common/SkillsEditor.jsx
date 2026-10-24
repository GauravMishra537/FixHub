import React, { useState } from 'react'
import { Award, Minus, Plus } from 'lucide-react'
import SkillStatusBadge from './SkillStatusBadge'

/**
 * selected: [{ id, name, status?, reason? }]   options: [{ id, name }]
 * onAdd(id), onRemove(id), onAddNew(name) (optional, shows a box to type a new skill name)
 * A status other than APPROVED shows as a small badge. A reason shows under a rejected skill.
 */
export default function SkillsEditor({ selected, options, editable = true, onAdd, onRemove, onAddNew }) {
  const [hover, setHover] = useState(false)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const free = options.filter((o) => !selected.some((s) => s.id === o.id))
  const first = selected[0]
  const extra = selected.length - 1
  const show = (hover && selected.length > 0) || adding

  const submitNew = () => {
    const t = text.trim()
    if (!t) return
    onAddNew(t)
    setText('')
  }

  return (
    <div
      className="relative inline-flex items-center gap-2"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setAdding(false)
      }}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
        <Award className="h-3.5 w-3.5 text-slate-500" />
        {first ? first.name : 'No skills'}
        {extra > 0 && (
          <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700">+{extra}</span>
        )}
      </span>

      {editable && (
        <button
          type="button"
          title="Add skill"
          onClick={() => setAdding((a) => !a)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {show && (
        <div className="absolute right-0 top-full z-50 pt-1">
          <div className="w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {selected.length > 0 && (
              <ul className="space-y-1">
                {selected.map((s) => (
                  <li key={s.id} className="rounded-lg px-2 py-1 text-sm text-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{s.name}</span>
                        {s.status && s.status !== 'APPROVED' && <SkillStatusBadge status={s.status} />}
                      </span>
                      {editable && (
                        <button
                          type="button"
                          title={`Remove ${s.name}`}
                          onClick={() => onRemove(s.id)}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {s.reason && <div className="mt-0.5 text-[11px] text-red-600">Reason: {s.reason}</div>}
                  </li>
                ))}
              </ul>
            )}

            {adding && (
              <div className={selected.length > 0 ? 'mt-2 border-t border-slate-100 pt-2' : ''}>
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Add skill</div>
                {free.length === 0 && <div className="px-2 py-1 text-sm text-slate-400">No more skills</div>}
                <div className="max-h-40 overflow-y-auto">
                  {free.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onAdd(o.id)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      {o.name}
                      <Plus className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>

                {onAddNew && (
                  <div className="mt-2 flex gap-1.5 border-t border-slate-100 px-1 pt-2">
                    <input
                      value={text}
                      maxLength={100}
                      placeholder="Not in the list? Type it"
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          submitNew()
                        }
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={submitNew}
                      disabled={!text.trim()}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}