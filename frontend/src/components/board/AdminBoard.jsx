import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CheckCircle2, Clock, ListChecks, PlayCircle, XCircle } from 'lucide-react'
import { ticketCoreApi } from '../../api/ticketCore'
import useTicketFilters from '../../hooks/useTicketFilters'
import useBoardColumn from '../../hooks/useBoardColumn'
import BoardColumn from './BoardColumn'
import TicketCard from './TicketCard'
import TicketDrawer from '../tickets/TicketDrawer'
import TicketFilterBar from '../tickets/TicketFilterBar'
import FilterMenu from '../common/FilterMenu'
import { PENDING_STATUSES, ACTIVE_STATUSES } from './boardColumns'

const PAGE = 10
const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED', 'RETURNED']
const REJECTED_STATUSES = ['REJECTED', 'CANCELLED']

// the four columns. users and skills fill them from memory, tickets are loaded page by page
const GROUPS = [
  { id: 'pending', title: 'Pending', color: 'amber', statuses: PENDING_STATUSES, empty: 'Nothing is waiting.' },
  { id: 'open', title: 'Open', color: 'violet', statuses: ACTIVE_STATUSES, empty: 'Nothing is open right now.' },
  { id: 'resolved', title: 'Resolved', color: 'emerald', statuses: RESOLVED_STATUSES, empty: 'Nothing resolved yet.' },
  { id: 'rejected', title: 'Rejected', color: 'rose', statuses: REJECTED_STATUSES, empty: 'Nothing rejected.' },
]

// the five boxes on top. "all" shows every column, the others show one column
const BOXES = [
  { id: 'all', label: 'All', icon: ListChecks, card: 'bg-blue-50 border-blue-100', iconBox: 'bg-blue-600' },
  { id: 'pending', label: 'Pending', icon: Clock, card: 'bg-amber-50 border-amber-100', iconBox: 'bg-amber-500' },
  { id: 'open', label: 'Open', icon: PlayCircle, card: 'bg-violet-50 border-violet-100', iconBox: 'bg-violet-600' },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2, card: 'bg-emerald-50 border-emerald-100', iconBox: 'bg-emerald-600' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, card: 'bg-rose-50 border-rose-100', iconBox: 'bg-rose-500' },
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

const shortDate = (v) => (v ? new Date(v).toLocaleDateString() : '')

// tickets of one group. enabled false = the group shows no tickets
function useTicketGroup(statuses, base, refresh, enabled) {
  const col = useBoardColumn(
    (page) => ticketCoreApi.search({ ...base, status: statuses, page, size: PAGE }),
    JSON.stringify([base, statuses, refresh, enabled]),
    enabled,
  )
  return enabled ? col : EMPTY
}

// a user or skill card
function PersonCard({ card, onReview, onReject }) {
  const isUser = card.kind === 'User'
  return (
    <div
      className={`min-w-0 rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-sm ${
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
        <span className="truncate text-sm font-medium text-slate-900">{card.title}</span>
      </div>
      <div className="mt-1 truncate text-xs text-slate-500">{card.sub}</div>
      {card.note && <div className="mt-1 text-xs text-slate-500">{card.note}</div>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{shortDate(card.date)}</span>

        {card.column === 'pending' && isUser && (
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={!card.reg.emailVerified}
              title={card.reg.emailVerified ? '' : 'Email not verified yet'}
              onClick={() => onReview(card.reg)}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => onReject(card.reg)}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        )}

        {card.column === 'pending' && !isUser && (
          <Link to="/admin/skill-review" className="text-xs font-semibold text-blue-600 hover:underline">
            Open skill review
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * Admin board. Users, skills and tickets in the same four columns.
 * registrations = registration requests, users = all accounts, skills = { pending, approved, rejected }
 * onReview(reg) and onReject(reg) open the dialogs on the page.
 */
export default function AdminBoard({ registrations, users, skills, loading, onReview, onReject }) {
  const { filters, activeCount, update, clear } = useTicketFilters()
  const [categories, setCategories] = useState([])
  const [skillFilter, setSkillFilter] = useState('')
  const [view, setView] = useState('all')
  const [openId, setOpenId] = useState(null)
  // goes up after an edit in the panel, so every column loads again
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    ticketCoreApi.categoryCounts('ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [refresh])

  // filters that only tickets understand
  const ticketFilterOn = Boolean(filters.categoryId || filters.priority || filters.createdFrom || filters.createdTo)
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

  const tickets = {
    pending: useTicketGroup(PENDING_STATUSES, base, refresh, showTickets),
    open: useTicketGroup(ACTIVE_STATUSES, base, refresh, showTickets),
    resolved: useTicketGroup(RESOLVED_STATUSES, base, refresh, showTickets),
    rejected: useTicketGroup(REJECTED_STATUSES, base, refresh, showTickets),
  }

  // user and skill cards per column
  const people = useMemo(() => {
    const q = (filters.q || '').toLowerCase()
    const match = (c) => !q || `${c.title} ${c.sub}`.toLowerCase().includes(q)
    const byDate = (a, b) => new Date(b.date || 0) - new Date(a.date || 0)

    const userFromReg = (r, column) => ({
      key: `u-${column}-${r.id}`,
      kind: 'User',
      column,
      title: r.fullName,
      sub: r.email,
      date: r.reviewedOn || r.createdAt,
      note: column === 'rejected' && r.rejectionReason ? `Reason: ${r.rejectionReason}` : '',
      reg: r,
    })
    const skillCard = (s, column) => ({
      key: `s-${s.userSkillId}`,
      kind: 'Skill',
      column,
      title: s.skillName,
      sub: `${s.userFullName}${s.userEmail ? ` (${s.userEmail})` : ''}`,
      date: s.reviewedOn || s.createdAt,
      note: column === 'rejected' && s.rejectReason ? `Reason: ${s.rejectReason}` : '',
      skillName: s.skillName,
    })

    const out = { pending: [], open: [], resolved: [], rejected: [] }

    if (showUsers) {
      registrations
        .filter((r) => r.requestStatus === 'PENDING')
        .forEach((r) => out.pending.push(userFromReg(r, 'pending')))
      registrations
        .filter((r) => r.requestStatus === 'REJECTED')
        .forEach((r) => out.rejected.push(userFromReg(r, 'rejected')))
      users
        .filter((u) => u.role !== 'ADMIN')
        .forEach((u) =>
          out.resolved.push({
            key: `a-${u.id}`,
            kind: 'User',
            column: 'resolved',
            title: u.fullName,
            sub: u.email,
            date: u.createdAt,
            note: [u.departmentName, u.designation].filter(Boolean).join(' · '),
          }),
        )
    }

    if (showSkills) {
      const keep = (s) => !skillFilter || s.skillName === skillFilter
      skills.pending.filter(keep).forEach((s) => out.pending.push(skillCard(s, 'pending')))
      skills.approved.filter(keep).forEach((s) => out.resolved.push(skillCard(s, 'resolved')))
      skills.rejected.filter(keep).forEach((s) => out.rejected.push(skillCard(s, 'rejected')))
    }

    Object.keys(out).forEach((k) => {
      out[k] = out[k].filter(match).sort(byDate)
    })
    return out
  }, [registrations, users, skills, filters.q, showUsers, showSkills, skillFilter])

  // names for the Skill filter button
  const skillOptions = useMemo(() => {
    const count = {}
    ;[...skills.pending, ...skills.approved, ...skills.rejected].forEach((s) => {
      count[s.skillName] = (count[s.skillName] || 0) + 1
    })
    return Object.keys(count)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name, hint: count[name] }))
  }, [skills])

  // numbers for the boxes
  const parts = (id) => {
    const list = people[id]
    return {
      users: list.filter((c) => c.kind === 'User').length,
      skills: list.filter((c) => c.kind === 'Skill').length,
      tickets: tickets[id].total,
    }
  }
  const totals = Object.fromEntries(
    GROUPS.map((g) => {
      const p = parts(g.id)
      return [g.id, { ...p, all: p.users + p.skills + p.tickets }]
    }),
  )
  const allTotals = GROUPS.reduce(
    (sum, g) => ({
      users: sum.users + totals[g.id].users,
      skills: sum.skills + totals[g.id].skills,
      tickets: sum.tickets + totals[g.id].tickets,
      all: sum.all + totals[g.id].all,
    }),
    { users: 0, skills: 0, tickets: 0, all: 0 },
  )

  const visibleGroups = view === 'all' ? GROUPS : GROUPS.filter((g) => g.id === view)

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {BOXES.map(({ id, label, icon: Icon, card, iconBox }) => {
          const t = id === 'all' ? allTotals : totals[id]
          const active = view === id
          return (
            <button
              type="button"
              key={id}
              onClick={() => setView(active ? 'all' : id)}
              aria-pressed={active}
              className={`flex items-center space-x-3 rounded-2xl border p-3 text-left transition hover:shadow-md ${card} ${
                active ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
            >
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white ${iconBox}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-slate-600">{label}</span>
                <span className="block text-2xl font-bold leading-tight text-slate-900">{loading ? '-' : t.all}</span>
                <span className="block truncate text-[10px] text-slate-500">
                  {loading ? '' : `Users ${t.users} · Skills ${t.skills} · Tickets ${t.tickets}`}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TicketFilterBar
          title="Admin board"
          filters={filters}
          update={update}
          clear={() => {
            clear()
            setSkillFilter('')
          }}
          activeCount={activeCount + (skillFilter ? 1 : 0)}
          categories={categories}
          showStatus={false}
          showSort
          extra={
            <FilterMenu
              icon={Award}
              label="Skill"
              allLabel="All skills"
              options={skillOptions}
              value={skillFilter}
              onChange={setSkillFilter}
            />
          }
        />

        <div className="flex items-start gap-4 overflow-x-auto p-4">
          {visibleGroups.map((g) => {
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
                {cards.map((c) => (
                  <PersonCard key={c.key} card={c} onReview={onReview} onReject={onReject} />
                ))}
                {t.items.map((ticket) => (
                  <TicketCard
                    key={`t-${ticket.id}`}
                    ticket={ticket}
                    selected={openId === ticket.id}
                    onOpen={() => setOpenId(ticket.id)}
                  />
                ))}
              </BoardColumn>
            )
          })}
        </div>
      </section>

      <TicketDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setRefresh((r) => r + 1)}
      />
    </div>
  )
}