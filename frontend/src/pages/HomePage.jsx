import React from 'react'
import { Wrench, Calendar, Package, BookOpen, Users, Database, Layers } from 'lucide-react'

export function HomePage() {
  const modules = [
    {
      title: 'Issue Reporting',
      code: 'ISSUE',
      description: 'Report electrical, plumbing, IT network, hardware, or office maintenance problems.',
      icon: Wrench,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'Room Booking',
      code: 'ROOM_BOOKING',
      description: 'Check availability, submit meeting room reservations, and manage schedule approvals.',
      icon: Calendar,
      color: 'text-violet-600 bg-violet-50 border-violet-200'
    },
    {
      title: 'Resource Requests',
      code: 'RESOURCE_REQUEST',
      description: 'Request equipment and peripherals, manage inventory stocks, and log returns.',
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Learning & Help',
      code: 'TOPIC_REQUEST',
      description: 'Post technical topic requests, discover by skills, and collaborate with peer volunteers.',
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ]

  const foundations = [
    {
      title: 'User Data Model',
      description: 'JPA entity with unique email constraint, BCrypt hash, timestamps, and indexes.',
      icon: Users
    },
    {
      title: 'Account Lifecycle',
      description: 'Strict status support (PENDING, ACTIVE, REJECTED, SUSPENDED) and roles (ADMIN, USER).',
      icon: Layers
    },
    {
      title: 'Layered Architecture',
      description: 'Entity -> Repository -> DTO -> Mapper -> Service -> Controller with Global Exception Handling.',
      icon: Database
    }
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Report. Book. Request. Learn.
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-3xl">
          FixHub is a centralized office request and ticket management platform powered by a universal workflow engine.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Universal Request Categories
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.title}
                className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 border ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-slate-900">{m.title}</h3>
                </div>
                <span className="inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mb-2">
                  {m.code}
                </span>
                <p className="text-sm text-slate-500">{m.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Phase 2 Foundation: User & Security Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {foundations.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="w-5 h-5 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HomePage
