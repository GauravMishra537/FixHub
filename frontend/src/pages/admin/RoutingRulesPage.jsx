import React, { useCallback, useEffect, useState } from 'react'
import { GitBranch, Loader2, Plus, Trash2 } from 'lucide-react'
import { routingApi } from '../../api/routing'
import { orgApi } from '../../api/org'
import { ticketCoreApi } from '../../api/ticketCore'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import SelectMenu from '../../components/common/SelectMenu'
import { EditableSelect } from '../../components/common/Editable'

const TYPES = [
  { value: 'ISSUE', label: 'Issue' },
  { value: 'ROOM_BOOKING', label: 'Infra booking' },
  { value: 'RESOURCE_REQUEST', label: 'Resource request' },
  { value: 'TOPIC_REQUEST', label: 'Topic request' },
]
const typeLabel = (v) => TYPES.find((t) => t.value === v)?.label || v

export function RoutingRulesPage() {
  const [rules, setRules] = useState([])
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ ticketType: 'ISSUE', categoryId: '', departmentId: '' })

  const load = useCallback(async () => {
    try {
      const [r, d, c] = await Promise.all([
        routingApi.list(),
        orgApi.departments(),
        ticketCoreApi.suggestCategories('ISSUE', ''),
      ])
      setRules(r || [])
      setDepartments(d || [])
      setCategories(c || [])
    } catch (e) {
      setError(e.message || 'Could not load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn, okText) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
      setNotice(okText)
      await load()
    } catch (e) {
      setError(e.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const deptOptions = departments
    .filter((d) => d.active !== false)
    .map((d) => ({ value: d.id, label: d.name }))

  const add = () =>
    run(async () => {
      await routingApi.create({
        ticketType: form.ticketType,
        categoryId: form.categoryId === '' ? null : form.categoryId,
        departmentId: form.departmentId,
        active: true,
      })
      setForm((f) => ({ ...f, categoryId: '', departmentId: '' }))
    }, 'Rule added')

  const change = (rule, patch) =>
    run(
      () =>
        routingApi.update(rule.id, {
          ticketType: rule.ticketType,
          categoryId: rule.categoryId,
          departmentId: rule.departmentId,
          active: rule.active,
          ...patch,
        }),
      'Rule updated',
    )

  return (
    <div>
      <PageHeader
        icon={GitBranch}
        title="Routing rules"
        subtitle="New tickets go to the department of the most exact rule: type + category, then type only."
      />
      {error && <Alert>{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Add a rule</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <SelectMenu
            value={form.ticketType}
            options={TYPES}
            onChange={(v) => setForm({ ticketType: v, categoryId: '', departmentId: form.departmentId })}
          />
          {form.ticketType === 'ISSUE' ? (
            <SelectMenu
              value={form.categoryId}
              placeholder="Any category"
              options={[
                { value: '', label: 'Any category' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
            />
          ) : (
            <div className="flex items-center px-1 text-sm text-slate-400">Whole type</div>
          )}
          <SelectMenu
            value={form.departmentId}
            placeholder="Select department"
            options={deptOptions}
            onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
          />
          <button
            type="button"
            disabled={busy || !form.departmentId}
            onClick={add}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add rule
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : rules.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No rules yet. New tickets stay unrouted.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-slate-800">{typeLabel(r.ticketType)}</td>
                  <td className="px-5 py-3 text-slate-800">
                    {r.categoryName || <span className="text-slate-400">Any category</span>}
                  </td>
                  <td className="w-64 px-3 py-2">
                    <EditableSelect
                      value={r.departmentId}
                      options={deptOptions}
                      onChange={(v) => change(r, { departmentId: v })}
                      renderValue={() => r.departmentName}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => change(r, { active: !r.active })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
                        r.active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {r.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      title="Delete rule"
                      onClick={() => window.confirm('Delete this rule?') && run(() => routingApi.remove(r.id), 'Rule deleted')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default RoutingRulesPage