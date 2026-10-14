import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAdminOverview,
  getAllUsers,
  approveUser,
  rejectUser,
  suspendUser,
  restoreUser,
} from '../api/admin'
import ConfirmDialog from '../components/common/ConfirmDialog'
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'ALL', label: 'All' },
]

const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-slate-100 text-slate-700 border-slate-300',
}

const ACTION_TEXT = {
  approve: {
    title: 'Approve account',
    confirm: 'Approve',
    message: (u) => `Approve ${u.fullName} (${u.email})? They will be able to sign in.`,
    done: 'User approved.',
  },
  reject: {
    title: 'Reject account',
    confirm: 'Reject',
    message: (u) => `Reject ${u.fullName} (${u.email})? Give a reason. The user will see it.`,
    done: 'User rejected.',
  },
  suspend: {
    title: 'Suspend account',
    confirm: 'Suspend',
    message: (u) => `Suspend ${u.fullName} (${u.email})? They will lose access immediately.`,
    done: 'User suspended.',
  },
  restore: {
    title: 'Restore account',
    confirm: 'Restore',
    message: (u) => `Restore ${u.fullName} (${u.email})? They will be able to sign in again.`,
    done: 'User restored.',
  },
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export function AdminDashboardPage() {
  const { user: currentUser } = useAuth()

  const [tab, setTab] = useState('PENDING')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const [dialog, setDialog] = useState(null) // { action, target }
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)
  const [dialogError, setDialogError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, usersData] = await Promise.all([
        getAdminOverview(),
        getAllUsers(tab === 'ALL' ? null : tab),
      ])
      setOverview(overviewData)
      setUsers(usersData || [])
    } catch (err) {
      setError(err.message || 'Failed to load administrator data')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const openDialog = (action, target) => {
    setDialog({ action, target })
    setReason('')
    setDialogError(null)
    setNotice(null)
  }

  const closeDialog = () => {
    if (acting) return
    setDialog(null)
    setDialogError(null)
  }

  const confirmAction = async () => {
    if (!dialog) return
    const { action, target } = dialog

    if (action === 'reject' && !reason.trim()) {
      setDialogError('A rejection reason is required.')
      return
    }

    setActing(true)
    setDialogError(null)
    try {
      if (action === 'approve') await approveUser(target.id)
      if (action === 'reject') await rejectUser(target.id, reason.trim())
      if (action === 'suspend') await suspendUser(target.id)
      if (action === 'restore') await restoreUser(target.id)

      setDialog(null)
      setNotice({ type: 'success', text: `${ACTION_TEXT[action].done} (${target.email})` })
      await load()
    } catch (err) {
      setDialogError(err.message || 'Action failed. Please try again.')
    } finally {
      setActing(false)
    }
  }

  const renderActions = (u) => {
    if (u.id === currentUser?.id) {
      return <span className="text-slate-400">You</span>
    }

    const btn = 'px-2.5 py-1 rounded-md text-xs font-semibold border disabled:opacity-40'

    if (u.status === 'PENDING') {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openDialog('approve', u)}
            disabled={!u.emailVerified}
            title={u.emailVerified ? 'Approve this account' : 'Email not verified yet'}
            className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700`}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => openDialog('reject', u)}
            className={`${btn} bg-white text-red-700 border-red-300 hover:bg-red-50`}
          >
            Reject
          </button>
        </div>
      )
    }

    if (u.status === 'ACTIVE') {
      return (
        <button
          type="button"
          onClick={() => openDialog('suspend', u)}
          className={`${btn} bg-white text-slate-700 border-slate-300 hover:bg-slate-50`}
        >
          Suspend
        </button>
      )
    }

    if (u.status === 'SUSPENDED') {
      return (
        <button
          type="button"
          onClick={() => openDialog('restore', u)}
          className={`${btn} bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50`}
        >
          Restore
        </button>
      )
    }

    return <span className="text-slate-400">—</span>
  }

  const activeText = dialog ? ACTION_TEXT[dialog.action] : null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Mode Active</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-sm text-slate-500 mt-1">
              Logged in as <span className="font-semibold text-slate-700">{currentUser?.fullName}</span> (
              {currentUser?.email})
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between"
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </span>
          <button type="button" onClick={load} className="text-xs underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.totalUsers ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Users</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{overview?.activeUsers ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{overview?.pendingUsers ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">System Admins</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{overview?.adminCount ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">User Accounts</h2>

        <div className="flex flex-wrap gap-2 mb-4" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                tab === t.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
            No users in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Verified</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Last login</th>
                  <th className="py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{u.fullName}</td>
                    <td className="py-2.5 px-4">{u.email}</td>
                    <td className="py-2.5 px-4">{u.emailVerified ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 px-4">{u.role}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          STATUS_STYLES[u.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {u.status}
                      </span>
                      {u.status === 'REJECTED' && u.rejectionReason && (
                        <div className="mt-1 text-[11px] text-slate-500">{u.rejectionReason}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">{formatDate(u.lastLoginAt)}</td>
                    <td className="py-2.5 px-4">{renderActions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={activeText?.title}
        message={dialog ? activeText.message(dialog.target) : ''}
        confirmLabel={activeText?.confirm}
        danger={dialog?.action === 'reject' || dialog?.action === 'suspend'}
        loading={acting}
        confirmDisabled={dialog?.action === 'reject' && !reason.trim()}
        onConfirm={confirmAction}
        onCancel={closeDialog}
      >
        {dialog?.action === 'reject' && (
          <div>
            <label htmlFor="reject-reason" className="block text-xs font-semibold text-slate-700 mb-1">
              Reason
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Not a company email address"
            />
          </div>
        )}
        {dialogError && <p className="mt-3 text-xs text-red-600">{dialogError}</p>}
      </ConfirmDialog>
    </div>
  )
}

export default AdminDashboardPage