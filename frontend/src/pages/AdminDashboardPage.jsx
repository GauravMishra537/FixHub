import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminOverview, getPendingUsers } from '../api/admin'
import { ShieldCheck, Users, Clock, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [overviewData, pendingData] = await Promise.all([
          getAdminOverview(),
          getPendingUsers(),
        ])
        setOverview(overviewData)
        setPendingUsers(pendingData || [])
      } catch (err) {
        setError(err.message || 'Failed to load administrator data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
              Logged in as <span className="font-semibold text-slate-700">{user?.fullName}</span> ({user?.email})
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>System: <strong className="text-slate-700">Healthy &amp; Operational</strong></span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">
          Loading system metrics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{overview?.totalUsers ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Registered database records</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Users</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{overview?.activeUsers ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Approved &amp; verified accounts</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{overview?.pendingUsers ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Awaiting admin review</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">System Admins</span>
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{overview?.adminCount ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Provisioned administrators</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Pending User Approvals</h2>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                No user registrations currently pending approval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingUsers.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{p.fullName}</td>
                        <td className="py-2.5 px-4">{p.email}</td>
                        <td className="py-2.5 px-4">{p.role}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboardPage
