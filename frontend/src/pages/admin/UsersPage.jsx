import React, { useEffect, useState } from 'react'
import { Users, Pencil, X, Loader2 } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { orgApi } from '../../api/org'
import PageHeader from '../../components/common/PageHeader'
import Alert from '../../components/common/Alert'
import ProfileForm from '../../components/admin/ProfileForm'
import SkillStatusBadge from '../../components/common/SkillStatusBadge'

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null) // { user, profile }
  const [opening, setOpening] = useState(null)

  const load = async () => {
    try {
      setUsers(await adminApi.getUsers())
    } catch (e) {
      setError(e.message || 'Could not load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openEdit = async (user) => {
    setError('')
    setNotice('')
    setOpening(user.id)
    try {
      const profile = await orgApi.getProfile(user.id)
      setEditing({ user, profile })
    } catch (e) {
      setError(e.message || 'Could not open user')
    } finally {
      setOpening(null)
    }
  }

  const save = async (body) => {
    await orgApi.updateProfile(editing.user.id, body)
    setEditing(null)
    setNotice('Details saved')
    await load()
  }

  const approvedIds = editing
    ? editing.profile.skills.filter((s) => s.status === 'APPROVED').map((s) => s.skillId)
    : []

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Users"
        subtitle="Set department, designation and skills for each employee."
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
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
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => openEdit(u)}
                        disabled={opening === u.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {opening === u.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                        )}
                        Set details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">{editing.user.fullName}</h2>
                <p className="text-xs text-slate-500">{editing.user.email}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editing.profile.skills.some((s) => s.status !== 'APPROVED') && (
              <div className="mb-4 text-xs text-slate-500">
                Other skill requests:{' '}
                {editing.profile.skills
                  .filter((s) => s.status !== 'APPROVED')
                  .map((s) => (
                    <span key={s.id} className="inline-flex items-center mr-2">
                      {s.skillName}&nbsp;
                      <SkillStatusBadge status={s.status} />
                    </span>
                  ))}
                <div className="mt-1">Review them in Skill review.</div>
              </div>
            )}

            <ProfileForm
              initial={{
                departmentId: editing.profile.departmentId,
                designation: editing.profile.designation,
                skillIds: approvedIds,
              }}
              lockedSkillIds={approvedIds}
              submitLabel="Save details"
              onSubmit={save}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
