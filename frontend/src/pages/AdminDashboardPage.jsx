import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ClipboardCheck, GitBranch, ScrollText, Users } from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import ProfileForm from '../components/admin/ProfileForm';
import AdminBoard from '../components/board/AdminBoard';
import { orgApi } from '../api/org';
import { getRequests, getUsers, rejectRequest } from '../api/admin';

const SHORTCUTS = [
  { to: '/admin/users', label: 'Users', icon: Users, tone: 'text-blue-600 bg-blue-50' },
  { to: '/admin/org-setup', label: 'Departments & Skills', icon: Building2, tone: 'text-violet-600 bg-violet-50' },
  { to: '/admin/skill-review', label: 'Skill Review', icon: ClipboardCheck, tone: 'text-emerald-600 bg-emerald-50' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, tone: 'text-amber-600 bg-amber-50' },
  { label: 'Routing Rules', icon: GitBranch, soon: true },
];

export default function AdminDashboardPage() {
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState({ pending: [], approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqs, usrs, sp, sa, sr] = await Promise.all([
        getRequests(),
        getUsers(),
        orgApi.skillRequests('PENDING'),
        orgApi.skillRequests('APPROVED'),
        orgApi.skillRequests('REJECTED'),
      ]);
      setRegistrations(reqs || []);
      setUsers(usrs || []);
      setSkills({ pending: sp || [], approved: sa || [], rejected: sr || [] });
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div>
      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <AdminBoard
        registrations={registrations}
        users={users}
        skills={skills}
        loading={loading}
        onReview={setApproveTarget}
        onReject={setRejectTarget}
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Management Shortcuts</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {SHORTCUTS.map(({ to, label, icon: Icon, tone, soon }) => {
            const body = (
              <>
                <span
                  className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl ${
                    soon ? 'bg-slate-100 text-slate-400' : tone
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className={`text-sm font-semibold ${soon ? 'text-slate-400' : 'text-slate-900'}`}>{label}</span>
                {soon && <span className="mt-0.5 text-[10px] text-slate-400">Coming soon</span>}
              </>
            );
            return soon ? (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 p-4 text-center"
              >
                {body}
              </div>
            ) : (
              <Link
                key={label}
                to={to}
                className="flex flex-col items-center rounded-2xl border border-slate-200 p-4 text-center transition hover:border-blue-300 hover:shadow-md"
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