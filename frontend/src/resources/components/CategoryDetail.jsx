import React, { useCallback, useEffect, useState } from 'react'
import { ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { resourcesApi } from '../../api/resources'
import CategoryForm from './CategoryForm'
import ItemForm from './ItemForm'
import { Confirm, ErrorBox, SMALL, Stat } from './bits'
import { itemKindLabel } from '../utils/meta'

/**
 * One group or one sub-category. Group: edit, hide, remove and its sub-categories.
 * Sub-category: edit, hide, remove and its items with stock.
 * subs: the sub-categories of this group (group only). onOpen(id): open another category.
 * onChanged(): reload the list behind it. onRemoved(): this one was removed, close the view.
 * Give it key={category.id} so a new one starts clean.
 */
export default function CategoryDetail({ category, subs, departments, onChanged, onRemoved, onOpen }) {
  const isGroup = category.parentId == null
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false) // a sub-category (group) or an item (sub-category)
  const [items, setItems] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'category' | 'item', id }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    if (isGroup) return
    try {
      setItems((await resourcesApi.adminItems(category.id)) || [])
    } catch (e) {
      setError(e.message || 'Could not load items')
    }
  }, [category.id, isGroup])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // one place for busy, error and reload
  const run = async (fn, reloadItems = false) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      if (reloadItems) await loadItems()
      await onChanged?.()
      return true
    } catch (e) {
      setError(e.message || 'Action failed')
      return false
    } finally {
      setBusy(false)
    }
  }

  // update replaces the whole category, so send every field
  const categoryBody = (over = {}) => ({
    name: category.name,
    parentId: category.parentId ?? null,
    icon: category.icon || null,
    sortOrder: category.sortOrder,
    active: category.active,
    departmentId: category.departmentId ?? null,
    ...over,
  })

  const itemBody = (i, over = {}) => ({
    categoryId: i.categoryId,
    name: i.name,
    description: i.description || '',
    kind: i.kind,
    totalStock: i.totalStock ?? null,
    maxPerRequest: i.maxPerRequest,
    active: i.active,
    ...over,
  })

  const approver = category.effectiveDepartmentName || 'Admin only'
  const blocked = category.subCategoryCount > 0 || category.itemCount > 0

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold ${category.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
              {category.name}
            </h2>
            {!category.active && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Hidden</span>
            )}
          </div>
          <div className="mt-0.5 text-sm text-slate-500">{isGroup ? 'Group' : 'Sub-category'}</div>
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className={`${SMALL} inline-flex items-center`}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => resourcesApi.updateCategory(category.id, categoryBody({ active: !category.active })))}
              className={SMALL}
            >
              {category.active ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              disabled={blocked}
              title={blocked ? (isGroup ? 'Remove its sub-categories first' : 'Remove its items first') : ''}
              onClick={() => setConfirm({ kind: 'category', id: category.id })}
              className={`${SMALL} inline-flex items-center`}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
            </button>
          </div>
        )}
      </div>

      <ErrorBox text={error} />

      {editing && (
        <div className="mt-3">
          <CategoryForm
            initial={category}
            isGroup={isGroup}
            departments={departments}
            busy={busy}
            onCancel={() => setEditing(false)}
            onSave={async (body) => {
              if (await run(() => resourcesApi.updateCategory(category.id, body))) setEditing(false)
            }}
          />
        </div>
      )}

      {confirm?.kind === 'category' && (
        <Confirm
          text={`Remove "${category.name}"? It is empty. Old requests keep their history.`}
          busy={busy}
          onNo={() => setConfirm(null)}
          onYes={async () => {
            if (await run(() => resourcesApi.deleteCategory(category.id))) onRemoved?.()
          }}
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {isGroup && <Stat label="Sub-categories" value={category.subCategoryCount} />}
        <Stat label="Items" value={isGroup ? subs.reduce((n, s) => n + s.itemCount, 0) : category.itemCount} />
        <Stat label="Approved by" value={approver} />
      </div>

      {/* ---------- group: its sub-categories ---------- */}
      {isGroup && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Sub-categories ({subs.length})</h3>
            {!adding && (
              <button type="button" onClick={() => setAdding(true)} className={`${SMALL} inline-flex items-center`}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add sub-category
              </button>
            )}
          </div>

          {adding && (
            <div className="mt-2">
              <CategoryForm
                isGroup={false}
                parentId={category.id}
                departments={departments}
                busy={busy}
                onCancel={() => setAdding(false)}
                onSave={async (body) => {
                  if (await run(() => resourcesApi.createCategory(body))) setAdding(false)
                }}
              />
            </div>
          )}

          {subs.length === 0 && <p className="py-3 text-sm text-slate-400">No sub-categories yet.</p>}
          <ul className="mt-1 divide-y divide-slate-100">
            {subs.map((s) => (
              <li
                key={s.id}
                tabIndex={0}
                role="button"
                onClick={() => onOpen?.(s.id)}
                onKeyDown={(e) => e.key === 'Enter' && onOpen?.(s.id)}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${s.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {s.name}
                    </span>
                    {!s.active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {s.itemCount} items, {s.effectiveDepartmentName || 'Admin only'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ---------- sub-category: its items ---------- */}
      {!isGroup && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Items{items ? ` (${items.length})` : ''}</h3>
            {!adding && (
              <button type="button" onClick={() => setAdding(true)} className={`${SMALL} inline-flex items-center`}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add an item
              </button>
            )}
          </div>

          {adding && (
            <div className="mt-2">
              <ItemForm
                busy={busy}
                onCancel={() => setAdding(false)}
                onSave={async (body) => {
                  if (await run(() => resourcesApi.createItem({ ...body, categoryId: category.id }), true)) {
                    setAdding(false)
                  }
                }}
              />
            </div>
          )}

          {!items && !error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          )}

          {items && items.length === 0 && <p className="py-3 text-sm text-slate-400">No items yet.</p>}

          {items && items.length > 0 && (
            <ul className="mt-1 divide-y divide-slate-100">
              {items.map((i) => (
                <li key={i.id} className="py-3">
                  {editItem === i.id ? (
                    <ItemForm
                      initial={i}
                      busy={busy}
                      onCancel={() => setEditItem(null)}
                      onSave={async (body) => {
                        if (await run(() => resourcesApi.updateItem(i.id, { ...body, categoryId: i.categoryId }), true)) {
                          setEditItem(null)
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${i.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                            {i.name}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {itemKindLabel(i.kind)}
                          </span>
                          {!i.active && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Hidden</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {i.kind === 'PHYSICAL'
                            ? `${i.availableStock} left of ${i.totalStock}, ${i.heldStock} given or held`
                            : 'No limit'}
                          , most {i.maxPerRequest} per request
                        </div>
                        {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setEditItem(i.id)} className={SMALL}>
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => resourcesApi.updateItem(i.id, itemBody(i, { active: !i.active })), true)}
                          className={SMALL}
                        >
                          {i.active ? 'Hide' : 'Show'}
                        </button>
                        <button type="button" onClick={() => setConfirm({ kind: 'item', id: i.id })} className={SMALL}>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {confirm?.kind === 'item' && confirm.id === i.id && (
                    <Confirm
                      text={`Remove "${i.name}"? It stops showing everywhere. An item with open requests cannot be removed.`}
                      busy={busy}
                      onNo={() => setConfirm(null)}
                      onYes={async () => {
                        if (await run(() => resourcesApi.deleteItem(i.id), true)) setConfirm(null)
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}