import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { resourcesApi } from '../../api/resources'
import CategoryDrawer from '../components/CategoryDrawer'
import CategoryForm from '../components/CategoryForm'
import { resourceIcon } from '../utils/meta'

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'

/** Admin: every group in a table. A row opens the right panel with its sub-categories, items and stock. */
export default function ResourceCatalogPage() {
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [cats, apps] = await Promise.all([resourcesApi.adminCategories(), resourcesApi.adminApprovers()])
      setCategories(cats || [])
      // the department list for the forms comes with the approvers
      setDepartments((apps || []).map((a) => ({ id: a.departmentId, name: a.departmentName })))
    } catch (e) {
      setError(e.message || 'Could not load the catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo(() => categories.filter((c) => c.parentId == null), [categories])
  const subsOf = useCallback((groupId) => categories.filter((c) => c.parentId === groupId), [categories])

  const create = async (body) => {
    setBusy(true)
    setError('')
    try {
      await resourcesApi.createCategory(body)
      setAdding(false)
      await load()
    } catch (e) {
      setError(e.message || 'Could not add')
    } finally {
      setBusy(false)
    }
  }

  const opened = categories.find((c) => c.id === openId) || null

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Resource catalog</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Click a category to edit it, hide it, or manage its sub-categories, items and stock.
            </p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" /> Add category
            </button>
          )}
        </div>

        {adding && (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">New category</div>
            <CategoryForm isGroup departments={departments} busy={busy} onSave={create} onCancel={() => setAdding(false)} />
          </div>
        )}

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>Category</th>
                <th className={TH}>Approved by</th>
                <th className={TH}>Sub-categories</th>
                <th className={TH}>Items</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading...</td>
                </tr>
              )}
              {!loading && groups.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No categories yet. Add one to start.</td>
                </tr>
              )}
              {groups.map((g) => {
                const Icon = resourceIcon(g.icon)
                const subs = subsOf(g.id)
                const total = subs.reduce((n, s) => n + s.itemCount, 0)
                return (
                  <tr
                    key={g.id}
                    tabIndex={0}
                    onClick={() => setOpenId(g.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setOpenId(g.id)}
                    className={`cursor-pointer hover:bg-slate-50 ${g.id === openId ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className={`font-medium ${g.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                          {g.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{g.effectiveDepartmentName || 'Admin only'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{subs.length}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{total}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          g.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {g.active ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <CategoryDrawer
        category={opened}
        subs={opened ? subsOf(opened.id) : []}
        departments={departments}
        onClose={() => setOpenId(null)}
        onChanged={load}
        onOpen={setOpenId}
      />
    </div>
  )
}