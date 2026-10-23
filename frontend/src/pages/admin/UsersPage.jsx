import React, { useCallback, useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import * as adminApi from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import SidePanel from '../../components/common/SidePanel'
import UserDetails from '../../components/admin/UserDetails'

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    try {
      setUsers(await adminApi.getUsers())
    } catch (e) {
      setError(e.message || 'Could not load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Users"
        subtitle="Click a user to set department, designation and skills."
      />
      {error && <Alert>{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center text-sm text-slate-500 py-10">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Designation</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const clickable = u.role !== 'ADMIN'
                return (
                  <tr
                    key={u.id}
                    onClick={clickable ? () => setSelected(u) : undefined}
                    className={`${clickable ? 'cursor-pointer hover:bg-blue-50/50' : ''} ${
                      selected?.id === u.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {u.departmentName || <span className="text-slate-400">Not set</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {u.designation || <span className="text-slate-400">Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                        {u.role}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <SidePanel
        open={Boolean(selected)}
        title={selected?.fullName}
        subtitle={selected?.email}
        fullPageTo={selected ? `/admin/users/${selected.id}` : undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <UserDetails
            key={selected.id}
            userId={selected.id}
            onSaved={() => {
              setNotice('Details saved')
              load()
            }}
          />
        )}
      </SidePanel>
    </div>
  )
}

export default UsersPage