import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Wrench, CalendarDays, Laptop, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TicketTypeTiles from '../components/tickets/TicketTypeTiles'
import UserBoard from '../components/board/UserBoard'
import DepartmentQueue from '../components/board/DepartmentQueue'
// used by the guest page only
const MODULES = [
  {
    title: 'Issue Ticket',
    tag: 'Workplace & IT',
    text: 'Report electrical, plumbing, AC, IT hardware, network, or office maintenance problems.',
    icon: Wrench,
    box: 'bg-red-50 border-red-200 hover:border-red-400',
    iconBox: 'bg-red-100 text-red-600',
  },
  {
    title: 'Infra Booking',
    tag: 'Facilities',
    text: 'Check availability, submit conference room reservations, and manage schedule approvals.',
    icon: CalendarDays,
    box: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconBox: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Resource Request',
    tag: 'Assets',
    text: 'Request laptops, projectors, monitors and other office resources.',
    icon: Laptop,
    box: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconBox: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'Topic Request',
    tag: 'Learning',
    text: 'Ask for a topic you want to learn and get it taught by a colleague.',
    icon: GraduationCap,
    box: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    iconBox: 'bg-amber-100 text-amber-600',
  },
]

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

function UserDashboard() {
  return (
    <div className="space-y-6">
      <TicketTypeTiles />
      <UserBoard />
      <DepartmentQueue />
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return <GuestHome />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <UserDashboard />
}