import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Building2, ClipboardCheck, GitBranch,Users, History, ScrollText } from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Alert from '../components/common/Alert';
import SidePanel from '../components/common/SidePanel';
import AdminBoard from '../components/board/AdminBoard';
import RegistrationReview from '../components/admin/RegistrationReview';
import UserDetails from '../components/admin/UserDetails';
import SkillRequestDetails from '../components/admin/SkillRequestDetails';
import { orgApi } from '../api/org';
import { getRequests, getUsers, rejectRequest } from '../api/admin';

const SHORTCUTS = [
  { to: '/admin/ticket-history', label: 'Ticket History', icon: History, tone: 'text-rose-600 bg-rose-50' },
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

  // the item shown in the right panel: { type: 'registration' | 'user' | 'skill', ... }
  const [selected, setSelected] = useState(null);
  const [busySkillId, setBusySkillId] = useState(null);
  const [skillRejectTarget, setSkillRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  // silent = reload the data without the loading spinner on the board
  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
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

  const closePanel = () => setSelected(null);

  // ---------- registrations (panel) ----------
  const approveRegistration = async (reg, body) => {
    await orgApi.approveRegistration(reg.id, body);
    setNotice(`${reg.email} approved.`);
    setError('');
    setSelected(null);
    await load(true);
  };

  const rejectRegistration = async (reg, why) => {
    await rejectRequest(reg.id, why);
    setNotice(`${reg.email} rejected.`);
    setError('');
    setSelected(null);
    await load(true);
  };

  // ---------- skills ----------
  // these two throw on failure, the caller shows the message
  const doApproveSkill = async (s) => {
    await orgApi.approveSkill(s.userSkillId);
    setNotice(`${s.skillName} approved for ${s.userFullName}.`);
    setError('');
    setSelected(null);
    await load(true);
  };

  const doRejectSkill = async (s, why) => {
    await orgApi.rejectSkill(s.userSkillId, why);
    setNotice(`${s.skillName} rejected for ${s.userFullName}.`);
    setError('');
    setSelected(null);
    await load(true);
  };

  // Approve button on a card
  const approveSkillFromCard = async (s) => {
    setBusySkillId(s.userSkillId);
    setNotice('');
    try {
      await doApproveSkill(s);
    } catch (e) {
      setError(e.message || 'Action failed');
    } finally {
      setBusySkillId(null);
    }
  };

  // Reject button on a card asks for the reason in a small dialog
  const closeSkillReject = () => {
    if (acting) return;
    setSkillRejectTarget(null);
    setReason('');
  };

  const confirmSkillReject = async () => {
    if (!skillRejectTarget) return;
    setActing(true);
    setNotice('');
    try {
      await doRejectSkill(skillRejectTarget, reason.trim());
    } catch (e) {
      setError(e.message || 'Action failed');
    } finally {
      setActing(false);
      setSkillRejectTarget(null);
      setReason('');
    }
  };

  // ---------- panel header ----------
  let panelTitle = '';
  let panelSubtitle = '';
  let fullPageTo;
  if (selected?.type === 'registration') {
    panelTitle = selected.reg.fullName;
    panelSubtitle = selected.reg.email;
    fullPageTo = `/admin/requests/${selected.reg.id}`;
  } else if (selected?.type === 'user') {
    panelTitle = selected.user.fullName;
    panelSubtitle = selected.user.email;
    fullPageTo = `/admin/users/${selected.user.id}`;
  } else if (selected?.type === 'skill') {
    panelTitle = selected.skill.skillName;
    panelSubtitle = selected.skill.userFullName;
    fullPageTo = '/admin/skill-review';
  }

  return (
    <div className="space-y-6">
      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <AdminBoard
        registrations={registrations}
        users={users}
        skills={skills}
        loading={loading}
        onSelect={setSelected}
        onSkillApprove={approveSkillFromCard}
        onSkillReject={setSkillRejectTarget}
        busySkillId={busySkillId}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

      <SidePanel
        open={Boolean(selected)}
        title={panelTitle}
        subtitle={panelSubtitle}
        fullPageTo={fullPageTo}
        onClose={closePanel}
      >
        {selected?.type === 'registration' && (
          <RegistrationReview
            key={`reg-${selected.reg.id}`}
            reg={selected.reg}
            onApprove={(body) => approveRegistration(selected.reg, body)}
            onReject={(why) => rejectRegistration(selected.reg, why)}
          />
        )}
        {selected?.type === 'user' && (
          <UserDetails
            key={`user-${selected.user.id}`}
            userId={selected.user.id}
            onSaved={() => {
              setNotice('Details saved.');
              load(true);
            }}
          />
        )}
        {selected?.type === 'skill' && (
          <SkillRequestDetails
            key={`skill-${selected.skill.userSkillId}`}
            skill={selected.skill}
            onApprove={() => doApproveSkill(selected.skill)}
            onReject={(why) => doRejectSkill(selected.skill, why)}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={Boolean(skillRejectTarget)}
        loading={acting}
        onConfirm={confirmSkillReject}
        onCancel={closeSkillReject}
        title="Reject skill"
        message={
          skillRejectTarget
            ? `Reject ${skillRejectTarget.skillName} for ${skillRejectTarget.userFullName}? Give a reason.`
            : ''
        }
        confirmLabel="Reject"
        danger
        confirmDisabled={reason.trim().length === 0}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Reason (required)"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </ConfirmDialog>
    </div>
  );
}