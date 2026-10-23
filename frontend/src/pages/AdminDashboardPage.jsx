import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ListChecks,
  Loader2,
  ScrollText,
  Users,
  XCircle,
  Tags,
  DoorOpen,
  Laptop,
  GitBranch,
  Ticket
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import ProfileForm from '../components/admin/ProfileForm';
import SkillStatusBadge from '../components/common/SkillStatusBadge';
import { orgApi } from '../api/org';
import { ticketCoreApi } from '../api/ticketCore';
import { getRequests, getUsers, rejectRequest } from '../api/admin';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');

const SHORTCUTS = [
  { to: '/admin/users', label: 'Users', icon: Users, tone: 'text-blue-600 bg-blue-50' },
    { to: '/admin/tickets', label: 'Tickets', icon: Ticket, tone: 'text-sky-600 bg-sky-50' },
  { to: '/admin/org-setup', label: 'Departments & Skills', icon: Building2, tone: 'text-violet-600 bg-violet-50' },
  { to: '/admin/skill-review', label: 'Skill Review', icon: ClipboardCheck, tone: 'text-emerald-600 bg-emerald-50' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, tone: 'text-amber-600 bg-amber-50' },
    { to: '/admin/categories', label: 'Categories', icon: Tags, tone: 'text-rose-600 bg-rose-50' },
  { label: 'Rooms', icon: DoorOpen, soon: true },
  { label: 'Resources', icon: Laptop, soon: true },
  { label: 'Routing Rules', icon: GitBranch, soon: true },
];

const CARD_IDS = ['all', 'pending', 'rejected', 'resolved'];
const CARD_STATUS = { all: null, pending: 'PENDING', rejected: 'REJECTED', resolved: 'APPROVED' };
const CARD_TITLES = {
  all: 'All requests',
  pending: 'Pending requests',
  rejected: 'Rejected requests',
  resolved: 'Resolved requests',
};
// where the "View tickets" link goes for each box. Rejected has no tickets yet
const TICKET_LINKS = {
  all: '/admin/tickets',
  pending:
    '/admin/tickets?status=NEW&status=OPEN&status=ASSIGNED&status=IN_PROGRESS&status=ON_HOLD&status=REOPENED',
  rejected: null,
  resolved: '/admin/tickets?status=RESOLVED&status=CLOSED',
};
export default function AdminDashboardPage() {
  const [requests, setRequests] = useState([]); // registration requests
  const [users, setUsers] = useState([]);
  const [skillPending, setSkillPending] = useState([]);
  const [skillApproved, setSkillApproved] = useState([]);
  const [skillRejected, setSkillRejected] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({ all: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
           // size 1 is enough, only the total number is used. a failure here must not break the page
      const ticketCount = (params) =>
        ticketCoreApi
          .search({ size: 1, ...params })
          .then((r) => r.totalElements)
          .catch(() => 0);

      const [reqs, usrs, sp, sa, sr, tAll, tPending, tResolved] = await Promise.all([
        getRequests(),
        getUsers(),
        orgApi.skillRequests('PENDING'),
        orgApi.skillRequests('APPROVED'),
        orgApi.skillRequests('REJECTED'),
        ticketCount({}),
        ticketCount({ group: 'PENDING' }),
        ticketCount({ group: 'RESOLVED' }),
      ]);
      setTicketCounts({ all: tAll, pending: tPending, resolved: tResolved });
      setRequests(reqs || []);
      setRequests(reqs || []);
      setUsers(usrs || []);
      setSkillPending(sp || []);
      setSkillApproved(sa || []);
      setSkillRejected(sr || []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingUsers = useMemo(() => requests.filter((r) => r.requestStatus === 'PENDING'), [requests]);
  const rejectedUsers = useMemo(() => requests.filter((r) => r.requestStatus === 'REJECTED'), [requests]);
  // every non-admin account was approved by an admin
  const approvedUsers = useMemo(() => users.filter((u) => u.role !== 'ADMIN').length, [users]);

  const pendingCount = pendingUsers.length + skillPending.length + ticketCounts.pending;
  const rejectedCount = rejectedUsers.length + skillRejected.length;
  const resolvedCount = approvedUsers + skillApproved.length + ticketCounts.resolved;
  const allCount =
    pendingUsers.length +
    rejectedUsers.length +
    approvedUsers +
    skillPending.length +
    skillRejected.length +
    skillApproved.length +
    ticketCounts.all;
    // one flat list of everything that needed (or needs) an admin decision
  const items = useMemo(() => {
    const list = [];
    requests.forEach((r) => {
      if (r.requestStatus === 'PENDING' || r.requestStatus === 'REJECTED') {
        list.push({
          key: `u-${r.id}`,
          kind: 'User',
          title: r.fullName,
          sub: r.email,
          status: r.requestStatus,
          date: r.reviewedOn || r.createdAt,
          note: r.requestStatus === 'REJECTED' ? r.rejectionReason : '',
        });
      }
    });
    users
      .filter((u) => u.role !== 'ADMIN')
      .forEach((u) => {
        list.push({
          key: `a-${u.id}`,
          kind: 'User',
          title: u.fullName,
          sub: u.email,
          status: 'APPROVED',
          date: u.createdAt,
          note: [u.departmentName, u.designation].filter(Boolean).join(' · '),
        });
      });
    [...skillPending, ...skillApproved, ...skillRejected].forEach((s) => {
      list.push({
        key: `s-${s.userSkillId}`,
        kind: 'Skill',
        title: s.skillName,
        sub: `${s.userFullName}${s.userEmail ? ` (${s.userEmail})` : ''}`,
        status: s.status,
        date: s.reviewedOn || s.createdAt,
        note: s.status === 'REJECTED' ? s.rejectReason : '',
      });
    });
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [requests, users, skillPending, skillApproved, skillRejected]);

  const shown = items.filter(
    (i) =>
      (!selected || !CARD_STATUS[selected] || i.status === CARD_STATUS[selected]) &&
      (typeFilter === 'ALL' || i.kind === typeFilter)
  );

  const toggleCard = (id) => {
    setTypeFilter('ALL');
    setSelected((cur) => (cur === id ? null : id));
  };

  const closeReject = () => {
    if (acting) return;
    setRejectTarget(null);
    setReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActing(true);
    setError('');
    setNotice('');
    try {
      await rejectRequest(rejectTarget.id, reason.trim());
      setNotice(`${rejectTarget.email} rejected.`);
      setRejectTarget(null);
      setReason('');
      await load();
    } catch (e) {
      setError(e.message || 'Action failed');
      setRejectTarget(null);
      setReason('');
    } finally {
      setActing(false);
    }
  };

  const approve = async (body) => {
    await orgApi.approveRegistration(approveTarget.id, body);
    setNotice(`${approveTarget.email} approved.`);
    setApproveTarget(null);
    await load();
  };

  const statCards = [
    {
      label: 'All Requests',
      value: allCount,
      icon: ListChecks,
      card: 'bg-blue-50 border-blue-100',
      iconBox: 'bg-blue-600',
      sub: `Users ${pendingUsers.length + rejectedUsers.length + approvedUsers} · Skills ${
        skillPending.length + skillRejected.length + skillApproved.length
      } · Tickets ${ticketCounts.all}`,
    },
    {
      label: 'Pending Requests',
      value: pendingCount,
      icon: Clock,
      card: 'bg-amber-50 border-amber-100',
      iconBox: 'bg-amber-500',
      sub: `Users ${pendingUsers.length} · Skills ${skillPending.length} · Tickets ${ticketCounts.pending}`,
    },
    {
      label: 'Rejected Requests',
      value: rejectedCount,
      icon: XCircle,
      card: 'bg-rose-50 border-rose-100',
      iconBox: 'bg-rose-500',
      sub: `Users ${rejectedUsers.length} · Skills ${skillRejected.length} · Tickets 0`,
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      card: 'bg-emerald-50 border-emerald-100',
      iconBox: 'bg-emerald-600',
      sub: `Users ${approvedUsers} · Skills ${skillApproved.length} · Tickets ${ticketCounts.resolved}`,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Approve registrations and manage the workplace.</p>
      </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, card, iconBox, sub }, i) => {
          const id = CARD_IDS[i];
          const active = selected === id;
          return (
            <button
              type="button"
              key={label}
              onClick={() => toggleCard(id)}
              className={`text-left rounded-2xl border p-4 flex items-center space-x-3 transition hover:shadow-md ${card} ${
                active ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
            >
              <span className={`w-11 h-11 flex-shrink-0 rounded-xl text-white flex items-center justify-center ${iconBox}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-600">{label}</div>
                <div className="text-2xl font-bold text-slate-900 leading-tight">{loading ? '-' : value}</div>
                <div className="text-[10px] text-slate-500 truncate">{loading ? '' : sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <section className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              {CARD_TITLES[selected]} <span className="text-slate-400 font-normal">({shown.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 p-1">
                {['ALL', 'User', 'Skill'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      typeFilter === t ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'ALL' ? 'All' : `${t}s`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Nothing here.</div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {shown.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        i.kind === 'User' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {i.kind.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{i.title}</div>
                      <div className="text-xs text-slate-500 truncate">{i.sub}</div>
                      {i.note && <div className="text-xs text-slate-500">{i.status === 'REJECTED' ? `Reason: ${i.note}` : i.note}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(i.date)}</span>
                    <SkillStatusBadge status={i.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-2.5 border-t border-slate-100 text-[11px] text-slate-400">
            Tickets will show here once the Issue module is added.
          </div>
        </section>
      )}

      {skillPending.length > 0 && (
        <Link
          to="/admin/skill-review"
          className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <span>
            {skillPending.length} skill {skillPending.length === 1 ? 'request is' : 'requests are'} waiting for review.
          </span>
          <span className="font-semibold">Open Skill review</span>
        </Link>
      )}

      <div className="mt-6">
        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Pending User Registrations</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No pending registrations.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Email status</th>
                  <th className="px-5 py-3 font-semibold">Requested On</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{r.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{r.email}</td>
                    <td className="px-5 py-3">
                      {r.emailVerified ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          Not verified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!r.emailVerified}
                          title={r.emailVerified ? '' : 'Email not verified yet'}
                          onClick={() => setApproveTarget(r)}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(r)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Management Shortcuts</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SHORTCUTS.map(({ to, label, icon: Icon, tone, soon }) => {
            const body = (
              <>
                <span
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    soon ? 'bg-slate-100 text-slate-400' : tone
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </span>
                <span className={`text-sm font-semibold ${soon ? 'text-slate-400' : 'text-slate-900'}`}>{label}</span>
                {soon && <span className="text-[10px] text-slate-400 mt-0.5">Coming soon</span>}
              </>
            );
            return soon ? (
              <div
                key={label}
                className="rounded-2xl border border-dashed border-slate-200 p-4 flex flex-col items-center text-center"
              >
                {body}
              </div>
            ) : (
              <Link
                key={label}
                to={to}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center hover:border-blue-300 hover:shadow-md transition"
              >
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      <Modal
        open={Boolean(approveTarget)}
        title="Review registration"
        subtitle={approveTarget ? `${approveTarget.fullName} (${approveTarget.email})` : ''}
        onClose={() => setApproveTarget(null)}
      >
        {approveTarget && (
          <>
            <p className="mb-4 text-xs text-slate-500">
              Set department, designation and skills, then approve. All optional, you can change them later in Users.
            </p>
            <ProfileForm submitLabel="Approve" onSubmit={approve} onCancel={() => setApproveTarget(null)} />
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        loading={acting}
        onConfirm={confirmReject}
        onCancel={closeReject}
        title="Reject registration"
        message={rejectTarget ? `Reject ${rejectTarget.fullName} (${rejectTarget.email})? Give a reason.` : ''}
        confirmLabel="Reject"
        danger
        confirmDisabled={reason.trim().length === 0}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={255}
          rows={3}
          placeholder="Reason (required)"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </ConfirmDialog>
    </div>
  );
}