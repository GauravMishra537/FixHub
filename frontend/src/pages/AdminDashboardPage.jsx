import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, ShieldCheck, Trash2, Users, XCircle } from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  approveRequest,
  deleteUser,
  getRequests,
  getUsers,
  rejectRequest,
} from '../api/admin';

const TABS = {
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');

export default function AdminDashboardPage() {
  const { user: me } = useAuth();

  const [tab, setTab] = useState(TABS.PENDING);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [dialog, setDialog] = useState(null); // { type, target }
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqs, usrs] = await Promise.all([getRequests(), getUsers()]);
      setRequests(reqs || []);
      setUsers(usrs || []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () => requests.filter((r) => r.requestStatus === 'PENDING'),
    [requests]
  );
  const rejected = useMemo(
    () => requests.filter((r) => r.requestStatus === 'REJECTED'),
    [requests]
  );
  const admins = useMemo(() => users.filter((u) => u.role === 'ADMIN'), [users]);

  const closeDialog = () => {
    if (acting) return;
    setDialog(null);
    setReason('');
  };

  const confirm = async () => {
    if (!dialog) return;
    setActing(true);
    setError('');
    setNotice('');
    try {
      const { type, target } = dialog;
      if (type === 'approve') {
        await approveRequest(target.id);
        setNotice(`${target.email} approved.`);
      } else if (type === 'reject') {
        await rejectRequest(target.id, reason.trim());
        setNotice(`${target.email} rejected.`);
      } else if (type === 'delete') {
        await deleteUser(target.id);
        setNotice(`${target.email} deleted. They must register again.`);
      }
      setDialog(null);
      setReason('');
      await load();
    } catch (e) {
      setError(e.message || 'Action failed');
      setDialog(null);
      setReason('');
    } finally {
      setActing(false);
    }
  };

  const dialogProps = () => {
    if (!dialog) return {};
    const { type, target } = dialog;
    if (type === 'approve') {
      return {
        title: 'Approve registration',
        message: `Approve ${target.fullName} (${target.email})? A user account will be created.`,
        confirmLabel: 'Approve',
        danger: false,
      };
    }
    if (type === 'reject') {
      return {
        title: 'Reject registration',
        message: `Reject ${target.fullName} (${target.email})? Give a reason.`,
        confirmLabel: 'Reject',
        danger: true,
        confirmDisabled: reason.trim().length === 0,
      };
    }
    return {
      title: 'Delete user',
      message: `Delete ${target.fullName} (${target.email})? They cannot log in and must register again.`,
      confirmLabel: 'Delete user',
      danger: true,
    };
  };

  const statCards = [
    { label: 'Pending', value: pending.length, icon: Clock },
    { label: 'Rejected', value: rejected.length, icon: XCircle },
    { label: 'Active users', value: users.length, icon: Users },
    { label: 'Admins', value: admins.length, icon: ShieldCheck },
  ];

  const tabList = [
    { key: TABS.PENDING, label: `Pending (${pending.length})` },
    { key: TABS.REJECTED, label: `Rejected (${rejected.length})` },
    { key: TABS.ACTIVE, label: `Active (${users.length})` },
  ];

  const renderRequestRows = (rows, isPending) =>
    rows.map((r) => (
      <tr key={r.id} className="border-t border-slate-200">
        <td className="px-4 py-3 font-medium text-slate-900">{r.fullName}</td>
        <td className="px-4 py-3 text-slate-600">{r.email}</td>
        <td className="px-4 py-3">
          {r.emailVerified ? (
            <span className="text-green-700">Verified</span>
          ) : (
            <span className="text-amber-700">Not verified</span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
        {isPending ? (
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!r.emailVerified}
                title={r.emailVerified ? '' : 'Email not verified yet'}
                onClick={() => setDialog({ type: 'approve', target: r })}
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setDialog({ type: 'reject', target: r })}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          </td>
        ) : (
          <td className="px-4 py-3 text-slate-600">{r.rejectionReason || '-'}</td>
        )}
      </tr>
    ));

  const renderUserRows = () =>
    users.map((u) => (
      <tr key={u.id} className="border-t border-slate-200">
        <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
        <td className="px-4 py-3 text-slate-600">{u.email}</td>
        <td className="px-4 py-3 text-slate-600">{u.role}</td>
        <td className="px-4 py-3 text-slate-600">{formatDate(u.lastLoginAt)}</td>
        <td className="px-4 py-3">
          {me && u.id === me.id ? (
            <span className="text-sm text-slate-500">You</span>
          ) : (
            <button
              type="button"
              onClick={() => setDialog({ type: 'delete', target: u })}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete user
            </button>
          )}
        </td>
      </tr>
    ));

  const headers = {
    [TABS.PENDING]: ['Name', 'Email', 'Email status', 'Requested', 'Actions'],
    [TABS.REJECTED]: ['Name', 'Email', 'Email status', 'Requested', 'Reason'],
    [TABS.ACTIVE]: ['Name', 'Email', 'Role', 'Last login', 'Actions'],
  };

  const rowsCount =
    tab === TABS.PENDING ? pending.length : tab === TABS.REJECTED ? rejected.length : users.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Admin console</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">{label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {notice && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {tabList.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : rowsCount === 0 ? (
          <div className="p-10 text-center text-slate-500">Nothing here.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {headers[tab].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === TABS.PENDING && renderRequestRows(pending, true)}
              {tab === TABS.REJECTED && renderRequestRows(rejected, false)}
              {tab === TABS.ACTIVE && renderUserRows()}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        loading={acting}
        onConfirm={confirm}
        onCancel={closeDialog}
        {...dialogProps()}
      >
        {dialog?.type === 'reject' && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Reason (required)"
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        )}
      </ConfirmDialog>
    </div>
  );
}