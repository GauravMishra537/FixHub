import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Award } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import useTicketFilters from '../../hooks/useTicketFilters'
import useBoardColumn from '../../hooks/useBoardColumn'
import BoardColumn from './BoardColumn'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import TicketFilterBar from '../tickets/TicketFilterBar'
import FilterMenu from '../common/FilterMenu'
import { PENDING_STATUSES, ACTIVE_STATUSES, STATUS_OPTIONS } from './boardColumns'

const PAGE = 10
// resolved is not finished: it stays in Open until the requester or an admin closes it
const RESOLVED_STATUSES = ['CLOSED', 'RETURNED']
const REJECTED_STATUSES = ['REJECTED', 'CANCELLED']

const GROUPS = [
  { id: 'pending', title: 'Pending', color: 'amber', statuses: PENDING_STATUSES, empty: 'Nothing is waiting.' },
  { id: 'open', title: 'Open', color: 'violet', statuses: ACTIVE_STATUSES, empty: 'Nothing is open right now.' },
  { id: 'resolved', title: 'Resolved', color: 'emerald', statuses: RESOLVED_STATUSES, empty: 'Nothing resolved yet.' },
  { id: 'rejected', title: 'Rejected', color: 'rose', statuses: REJECTED_STATUSES, empty: 'Nothing rejected.' },
]

const EMPTY = {
  items: [],
  total: 0,
  loading: false,
  loadingMore: false,
  error: '',
  hasMore: false,
  loadMore: () => {},
  reload: () => {},
}

const PILL = {
  PENDING: ['Pending', 'bg-amber-50 text-amber-700 border-amber-200'],
  APPROVED: ['Approved', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  ACTIVE: ['Active', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  REJECTED: ['Rejected', 'bg-red-50 text-red-700 border-red-200'],
}

const shortDate = (v) => (v ? new Date(v).toLocaleDateString() : '')

function StatusPill({ status }) {
  const [label, cls] = PILL[status] || [status, 'bg-slate-50 text-slate-600 border-slate-200']
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  )
}

function useTicketGroup(statuses, base, refresh, enabled) {
  const col = useBoardColumn(
    (page) => ticketCoreApi.search({ ...base, status: statuses, page, size: PAGE }),
    JSON.stringify([base, statuses, refresh, enabled]),
    enabled,
  )
  return enabled ? col : EMPTY
}

// user or skill card. a click opens the right panel
function PersonCard({ card, onSelect, onSkillApprove, onSkillReject, busySkillId }) {
  const isUser = card.kind === 'User'
  const skill = card.target.skill
  const pendingSkill = !isUser && card.status === 'PENDING'
  const busy = skill && busySkillId === skill.userSkillId

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(card.target)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(card.target)
        }
      }}
      className={`min-w-0 cursor-pointer rounded-lg border border-l-4 border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
        isUser ? 'border-l-blue-400' : 'border-l-violet-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            isUser ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
          }`}
        >
          {card.kind.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{card.title}</span>
        <StatusPill status={card.status} />
      </div>
      <div className="mt-1 truncate text-xs text-slate-500">{card.sub}</div>
      {card.note && <div className="mt-1 text-xs text-slate-500">{card.note}</div>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{shortDate(card.date)}</span>

        {pendingSkill && (
          <div className="flex gap-1.5">
            {/*  */}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Admin board: users, skills and tickets in four columns.
 * onSelect({ type: 'registration' | 'user' | 'skill', ... }) opens the right panel on the page.
 * onSkillApprove(skill) and onSkillReject(skill) are the buttons on a pending skill card.
 */
export default function AdminBoard({
  registrations,
  users,
  skills,
  loading,
  onSelect,
  onSkillApprove,
  onSkillReject,
  busySkillId,
}) {
  const { filters, activeCount, update, clear } = useTicketFilters()
  const [categories, setCategories] = useState([])
  const [skillFilter, setSkillFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the ticket panel, so every column loads again
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    ticketCoreApi.categoryCounts('ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [refresh])

  // filters that only tickets understand
    const ticketFilterOn = Boolean(
    filters.categoryId || filters.priority || filters.createdFrom || filters.createdTo || statusFilter,
  )
  // a skill filter hides users and tickets. a ticket filter hides users and skills
  const showUsers = !ticketFilterOn && !skillFilter
  const showSkills = !ticketFilterOn
  const showTickets = !skillFilter

  const base = useMemo(
    () => ({
      q: filters.q,
      categoryId: filters.categoryId,
      priority: filters.priority,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      sortBy: filters.sortBy,
      direction: filters.direction,
    }),
    [filters.q, filters.categoryId, filters.priority, filters.createdFrom, filters.createdTo, filters.sortBy, filters.direction],
  )

  // a picked status narrows each ticket column. a status that does not belong to a column leaves it empty
  const groupStatuses = (g) => (statusFilter ? g.statuses.filter((s) => s === statusFilter) : g.statuses)
  const groupOn = (g) => showTickets && groupStatuses(g).length > 0

  const tickets = {
    pending: useTicketGroup(groupStatuses(GROUPS[0]), base, refresh, groupOn(GROUPS[0])),
    open: useTicketGroup(groupStatuses(GROUPS[1]), base, refresh, groupOn(GROUPS[1])),
    resolved: useTicketGroup(groupStatuses(GROUPS[2]), base, refresh, groupOn(GROUPS[2])),
    rejected: useTicketGroup(groupStatuses(GROUPS[3]), base, refresh, groupOn(GROUPS[3])),
  }

  const people = useMemo(() => {
    const q = (filters.q || '').toLowerCase()
    const match = (c) => !q || `${c.title} ${c.sub}`.toLowerCase().includes(q)
    const byDate = (a, b) => new Date(b.date || 0) - new Date(a.date || 0)

    const regCard = (r, column) => ({
      key: `r-${column}-${r.id}`,
      kind: 'User',
      status: r.requestStatus,
      title: r.fullName,
      sub: r.email,
      date: r.reviewedOn || r.createdAt,
      note: column === 'rejected' && r.rejectionReason ? `Reason: ${r.rejectionReason}` : '',
      target: { type: 'registration', reg: r },
    })
    const skillCard = (s) => ({
      key: `s-${s.userSkillId}`,
      kind: 'Skill',
      status: s.status,
      title: s.skillName,
      sub: `${s.userFullName}${s.userEmail ? ` (${s.userEmail})` : ''}`,
      date: s.reviewedOn || s.createdAt,
      note: s.status === 'REJECTED' && s.rejectReason ? `Reason: ${s.rejectReason}` : '',
      target: { type: 'skill', skill: s },
    })

    const out = { pending: [], open: [], resolved: [], rejected: [] }

    if (showUsers) {
      registrations
        .filter((r) => r.requestStatus === 'PENDING')
        .forEach((r) => out.pending.push(regCard(r, 'pending')))
      registrations
        .filter((r) => r.requestStatus === 'REJECTED')
        .forEach((r) => out.rejected.push(regCard(r, 'rejected')))
      users
        .filter((u) => u.role !== 'ADMIN')
        .forEach((u) =>
          out.resolved.push({
            key: `a-${u.id}`,
            kind: 'User',
            status: 'ACTIVE',
            title: u.fullName,
            sub: u.email,
            date: u.createdAt,
            note: [u.departmentName, u.designation].filter(Boolean).join(' · '),
            target: { type: 'user', user: u },
          }),
        )
    }

    if (showSkills) {
      const keep = (s) => !skillFilter || s.skillName === skillFilter
      skills.pending.filter(keep).forEach((s) => out.pending.push(skillCard(s)))
      skills.approved.filter(keep).forEach((s) => out.resolved.push(skillCard(s)))
      skills.rejected.filter(keep).forEach((s) => out.rejected.push(skillCard(s)))
    }

    Object.keys(out).forEach((k) => {
      out[k] = out[k].filter(match).sort(byDate)
    })
    return out
  }, [registrations, users, skills, filters.q, showUsers, showSkills, skillFilter])

  const skillOptions = useMemo(() => {
    const count = {}
    ;[...skills.pending, ...skills.approved, ...skills.rejected].forEach((s) => {
      count[s.skillName] = (count[s.skillName] || 0) + 1
    })
    return Object.keys(count)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name, hint: count[name] }))
  }, [skills])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <TicketFilterBar
        title="My board"
        filters={filters}
        update={update}
                clear={() => {
          clear()
          setSkillFilter('')
          setStatusFilter('')
        }}
        activeCount={activeCount + (skillFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
        categories={categories}
        showStatus={false}
        showSort
        extra={
          <>
            <FilterMenu
              icon={Activity}
              label="Status"
              allLabel="All statuses"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterMenu
              icon={Award}
              label="Skill"
              allLabel="All skills"
              options={skillOptions}
              value={skillFilter}
              onChange={setSkillFilter}
            />
          </>
        }
      />

      <div className="flex items-start gap-4 overflow-x-auto p-4">
        {GROUPS.map((g) => {
          const t = tickets[g.id]
          const cards = people[g.id]

          return (
            <BoardColumn
              key={g.id}
              title={g.title}
              color={g.color}
              count={cards.length + t.total}
              storageKey={`board.admin.${g.id}`}
              loading={loading || t.loading}
              loadingMore={t.loadingMore}
              error={t.error}
              hasMore={t.hasMore}
              onLoadMore={t.loadMore}
              onRetry={t.reload}
              emptyText={g.empty}
            >
              {[
                ...cards.map((c) => (
                  <PersonCard
                    key={c.key}
                    card={c}
                    onSelect={onSelect}
                    onSkillApprove={onSkillApprove}
                    onSkillReject={onSkillReject}
                    busySkillId={busySkillId}
                  />
                )),
                ...t.items.map((ticket) => (
                  <TicketCard
                    key={`t-${ticket.id}`}
                    ticket={ticket}
                    selected={openId === ticket.id}
                    onOpen={() => setOpenId(ticket.id)}
                  />
                )),
              ]}
            </BoardColumn>
          )
        })}
      </div>

      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setRefresh((r) => r + 1)}
      />
    </section>
  )
}