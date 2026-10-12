import React from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  Calendar,
  Package,
  BookOpen,
  LogIn,
  UserPlus
} from 'lucide-react'

export function HomePage() {
  const trackingIssues = [
    {
      title: 'Issue Ticket',
      badge: 'Workplace & IT',
      icon: Wrench,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      description: 'Report electrical, plumbing, AC, IT hardware, network, or office maintenance problems.'
    },
    {
      title: 'Room Booking',
      badge: 'Facilities',
      icon: Calendar,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'Check availability, submit conference room reservations, and manage schedule approvals.'
    },
    {
      title: 'Resource Request',
      badge: 'Assets & Stock',
      icon: Package,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'Request equipment, peripherals, hardware assets, inventory checkout, and returns.'
    },
    {
      title: 'Topic / Learning Request',
      badge: 'Peer Knowledge',
      icon: BookOpen,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      description: 'Post technical topic requests, discover by skills, and collaborate with peer volunteers.'
    }
  ]

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Fix<span className="text-blue-600">Hub</span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-slate-700 tracking-tight">
          Report. Book. Request. Learn.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          One platform for all office workplace requests, room reservations, resource management, and peer learning.
        </p>

        {/* Access FixHub Quick Action Card */}
        <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm mx-auto">
          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4 mr-2 text-slate-500" />
              Login
            </Link>
            <Link
              to="/register"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Tracking Request Modules */}
      <div>
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Tracking Modules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a request category to track and resolve office operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {trackingIssues.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <span className="text-[11px] font-medium text-slate-500">{item.badge}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HomePage
