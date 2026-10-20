import React, { useState } from 'react'
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
  LogIn,
  UserPlus,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MODULES = [
  {
    to: '/issues',
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
    box: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    iconBox: 'bg-amber-100 text-amber-600',
  },
]

const STATS = [
  { label: 'Total Tickets', value: 0, icon: Ticket, card: 'bg-blue-50 border-blue-100', iconBox: 'bg-blue-600' },
  { label: 'Pending', value: 0, icon: Clock, card: 'bg-amber-50 border-amber-100', iconBox: 'bg-amber-500' },
  { label: 'Resolved', value: 0, icon: CheckCircle2, card: 'bg-emerald-50 border-emerald-100', iconBox: 'bg-emerald-600' },
  { label: 'My Tickets', value: 0, icon: UserRound, card: 'bg-violet-50 border-violet-100', iconBox: 'bg-violet-600' },
]

const TABS = ['My Tickets', 'Assigned to Me', 'Recent Activity']
const COLUMNS = ['ID', 'Title', 'Type', 'Status', 'Priority', 'Created On', 'Action']

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

      <div className="mt-8 inline-flex gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <Link
          to="/login"
          className="inline-flex items-center px-8 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Login
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Register
        </Link>
      </div>

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
  const [tab, setTab] = useState(TABS[0])
  const firstName = (name || '').split(' ')[0]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, {firstName}</h1>
        <p className="text-sm text-slate-500">Here is what is happening with your requests.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, card, iconBox }) => (
          <div key={label} className={`rounded-2xl border p-4 flex items-center space-x-3 ${card}`}>
            <span className={`w-11 h-11 rounded-xl text-white flex items-center justify-center ${iconBox}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-slate-600">{label}</div>
              <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
            </div>
          </div>
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

      <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 border-b border-slate-100 px-3 pt-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                {COLUMNS.map((c) => (
                  <th key={c} className="px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
                  Nothing in "{tab}" yet. Use a quick action above to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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