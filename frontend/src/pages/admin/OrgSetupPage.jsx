import React, { useEffect, useState } from 'react'
import { Building2, BadgeCheck, Plus, Trash2, Power, Loader2 } from 'lucide-react'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'

const INPUT =
  'flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function AddRow({ placeholder, onAdd }) {
  const [value, setValue] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!value.trim()) return
    const ok = await onAdd(value.trim())
    if (ok) setValue('')
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mb-4">
      <input className={INPUT} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm">
        <Plus className="w-4 h-4 mr-1" />
        Add
      </button>
    </form>
  )
}

function ManageList({ icon: Icon, title, hint, items, loading, placeholder, inactiveLabel, onAdd, onToggle, onDelete }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center mb-1">
        <Icon className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="ml-2 text-xs text-slate-400">{items.length}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">{hint}</p>

      <AddRow placeholder={placeholder} onAdd={onAdd} />

      {loading ? (
        <div className="flex items-center text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Nothing yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center">
                <span className={`text-sm ${item.active ? 'text-slate-800' : 'text-slate-400'}`}>{item.name}</span>
                {!item.active && (
                  <span className="ml-2 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {inactiveLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  title={item.active ? 'Deactivate' : 'Activate'}
                  onClick={() => onToggle(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  title="Delete"
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function OrgSetupPage() {
  const [departments, setDepartments] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [d, s] = await Promise.all([orgApi.departments(), orgApi.adminSkills()])
      setDepartments(d)
      setSkills(s)
    } catch (e) {
      setError(e.message || 'Could not load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const run = async (fn) => {
    setError('')
    try {
      await fn()
      await load()
      return true
    } catch (e) {
      setError(e.message || 'Action failed')
      return false
    }
  }

  const confirmDelete = (what) => window.confirm(`Delete ${what}?`)

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="Departments & skills"
        subtitle="Set up the lists admins use when approving employees."
      />
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 md:grid-cols-2">
        <ManageList
          icon={Building2}
          title="Departments"
          hint="Every employee belongs to one department."
          items={departments}
          loading={loading}
          placeholder="New department"
          inactiveLabel="inactive"
          onAdd={(name) => run(() => orgApi.createDepartment(name))}
          onToggle={(d) => run(() => orgApi.updateDepartment(d.id, { name: d.name, active: !d.active }))}
          onDelete={(d) => confirmDelete(d.name) && run(() => orgApi.deleteDepartment(d.id))}
        />
        <ManageList
          icon={BadgeCheck}
          title="Skills"
          hint="Names typed by users stay inactive until you accept them in Skill review."
          items={skills}
          loading={loading}
          placeholder="New skill"
          inactiveLabel="not approved"
          onAdd={(name) => run(() => orgApi.createSkill(name))}
          onToggle={(s) => run(() => orgApi.updateSkill(s.id, { name: s.name, active: !s.active }))}
          onDelete={(s) => confirmDelete(s.name) && run(() => orgApi.deleteSkill(s.id))}
        />
      </div>
    </div>
  )
}

export default OrgSetupPage