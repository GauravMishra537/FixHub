import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Wrench,
  CalendarDays,
  Laptop,
  GraduationCap,
  Ticket,
  Clock,
  CheckCircle2,
  UserRound,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ticketCoreApi } from '../api/ticketCore'
import useTicketFilters from '../hooks/useTicketFilters'
import TicketTable from '../components/tickets/TicketTable'
import TicketFilterBar from '../components/tickets/TicketFilterBar'

const MODULES = [
  {
    to: '/issues/new',
    title: 'Issue Ticket',
    tag: 'Workplace & IT',
    text: 'Report electrical, plumbing, AC, IT hardware, network, or office maintenance problems.',
    action: 'Create Issue Ticket',
    icon: Wrench,
    box: 'bg-red-50 border-red-200 hover:border-red-400',
    iconBox: 'bg-red-100 text-red-600',
  },
  {
    to: '/rooms',
    title: 'Room Booking',
    tag: 'Facilities',
    text: 'Check availability, submit conference room reservations, and manage schedule approvals.',
    action: 'Book Room',
    icon: CalendarDays,
    box: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconBox: 'bg-blue-100 text-blue-600',
  },
  {
    to: '/resources',
    title: 'Resource Request',
    tag: 'Assets',
    text: 'Request laptops, projectors, monitors and other office resources.',
    action: 'Request Resource',
    icon: Laptop,
    box: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconBox: 'bg-emerald-100 text-emerald-600',
  },
  {
    to: '/topics',
    title: 'Topic Request',
    tag: 'Learning',
    text: 'Ask for a topic you want to learn and get it taught by a colleague.',
    action: 'Request Learning / Topic',
    icon: GraduationCap,
    box: 'bg-amber-50 border-amber-100 hover:border-amber-400',
    iconBox: 'bg-amber-100 text-amber-600',
  },
]

const VIEW_TITLES = {
  MINE: 'My Tickets',
  PENDING: 'My Pending Tickets',
  RESOLVED: 'My Resolved Tickets',
  TOTAL: 'All Tickets',
}

const VIEW_HINTS = {
  MINE: 'Every ticket you raised. Click a row to see details.',
  PENDING: 'Your tickets that are still being worked on.',
  RESOLVED: 'Your tickets that are done.',
  TOTAL: 'Every public ticket in the office plus your own. Click a row to see details.',
}

function GuestHome() {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-black tracking-tight text-slate-900">
        Fix<span className="text-blue-600">Hub</span>
      </h1>
      <p className="mt-3 text-lg font-semibold text-slate-700">Report. Book. Request. Learn.</p>
      <p className="mt-2 text-sm text-slate-500">
        One platform for all office workplace requests, room reservations, resource management, and peer learning.
      </p>

      <h2 className="mt-12 text-xl font-bold text-slate-900">Tracking Modules</h2>
      <p className="text-sm text-slate-500 mb-6">Login to track and resolve office operations</p>

      <div className="grid gap-5 md:grid-cols-2 text-left max-w-4xl mx-auto">
        {MODULES.map((m) => (
          <Link
            key={m.title}
            to="/login"
            className={`rounded-2xl border p-5 bg-white shadow-sm hover:shadow-md transition ${m.box}`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.iconBox}`}>
                <m.icon className="w-5 h-5" />
              </span>
              <div>
                <div className="font-semibold text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-500">{m.tag}</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">{m.text}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function UserDashboard({ name }) {
  const firstName = (name || '').split(' ')[0]

  // filters, sorting and page live in the URL, so refresh and shared links keep them
  const { filters, apiParams, activeCount, update, clear, sortBy } = useTicketFilters()

  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    ticketCoreApi.summary().then(setSummary).catch((e) => setError(e.message))
    ticketCoreApi.categoryCounts('ISSUE').then(setCategories).catch(() => setCategories([]))
  }, [])

  // reload the list whenever a filter, the sort or the page changes.
  // an older answer that arrives late is ignored
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ticketCoreApi
      .search(apiParams)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiParams])

  const selectView = (key) => {
    if (key !== filters.view) update({ view: key })
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stats = [
    { key: 'MINE', label: 'My Tickets', value: summary?.mine, icon: UserRound, card: 'bg-violet-50 border-violet-100', iconBox: 'bg-violet-600' },
    { key: 'PENDING', label: 'Pending', value: summary?.minePending, icon: Clock, card: 'bg-amber-50 border-amber-100', iconBox: 'bg-amber-500' },
    { key: 'RESOLVED', label: 'Resolved', value: summary?.mineResolved, icon: CheckCircle2, card: 'bg-emerald-50 border-emerald-100', iconBox: 'bg-emerald-600' },
    { key: 'TOTAL', label: 'All Tickets', value: summary?.totalVisible, icon: Ticket, card: 'bg-blue-50 border-blue-100', iconBox: 'bg-blue-600' },
  ]

  const emptyText =
    activeCount > 0
      ? 'No tickets match these filters.'
      : filters.view === 'TOTAL'
        ? 'No tickets yet.'
        : 'No tickets here. Use a quick action above to raise one.'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, {firstName}</h1>
        <p className="text-sm text-slate-500">Here is what is happening with your requests.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* 4 clickable boxes */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ key, label, value, icon: Icon, card, iconBox }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectView(key)}
            className={`rounded-2xl border p-4 flex items-center space-x-3 text-left transition hover:shadow-md ${card} ${
              filters.view === key ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <span className={`w-11 h-11 rounded-xl text-white flex items-center justify-center ${iconBox}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-slate-600">{label}</div>
              <div className="text-2xl font-bold text-slate-900 leading-tight">{value ?? '-'}</div>
            </div>
          </button>
        ))}
      </div>

      <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              to={m.to}
              className={`group rounded-2xl border p-5 flex flex-col items-center text-center transition hover:shadow-md ${m.box}`}
            >
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${m.iconBox}`}>
                <m.icon className="w-6 h-6" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{m.action}</span>
              <span className="text-xs text-slate-500 mt-1">{m.tag}</span>
              <span className="mt-2 inline-flex items-center text-xs font-medium text-slate-600 group-hover:text-slate-900">
                Open <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* the one list section, at the bottom */}
      <section ref={listRef} className="mt-6 scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 pt-4 pb-2">
          <h2 className="font-semibold text-slate-900">{VIEW_TITLES[filters.view]}</h2>
          <p className="text-xs text-slate-500">{VIEW_HINTS[filters.view]}</p>
        </div>

        <TicketFilterBar
          filters={filters}
          update={update}
          clear={clear}
          activeCount={activeCount}
          categories={categories}
        />

        <TicketTable
          data={data}
          loading={loading}
          emptyText={emptyText}
          onPage={(page) => update({ page })}
          sortBy={filters.sortBy}
          direction={filters.direction}
          onSort={sortBy}
          size={filters.size}
          onSize={(size) => update({ size })}
        />
      </section>
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return <GuestHome />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <UserDashboard name={user?.fullName} />
}