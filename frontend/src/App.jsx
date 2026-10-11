import React from 'react'
import { Wrench, Calendar, Package, BookOpen } from 'lucide-react'

export function App() {
  const modules = [
    {
      title: 'Issue Reporting',
      description: 'Report electrical, plumbing, network, hardware, or office maintenance problems.',
      icon: Wrench,
      badge: 'Active Engine',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'Room Booking',
      description: 'Check availability, submit meeting room reservations, and manage schedule approvals.',
      icon: Calendar,
      badge: 'Active Engine',
      color: 'text-violet-600 bg-violet-50 border-violet-200'
    },
    {
      title: 'Resource Requests',
      description: 'Request equipment and peripherals, manage inventory stocks, and log returns.',
      icon: Package,
      badge: 'Active Engine',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Learning & Help',
      description: 'Post technical topic requests, discover by skills, and collaborate with peer volunteers.',
      icon: BookOpen,
      badge: 'Active Engine',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-slate-900">FixHub</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              v0.1.0
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Office Management Platform
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Report. Book. Request. Learn.
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            FixHub is a centralized office request and ticket management platform powered by a universal workflow engine.
          </p>
        </div>

        {/* 4 Core Modules */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
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
                <h2 className="text-base font-semibold text-slate-900">{m.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{m.description}</p>
              </div>
            )
          })}
        </div>

        {/* Stack Overview */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            System Architecture Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="block text-xs text-slate-500">Frontend Client</span>
              <span className="font-semibold text-slate-800">React (JavaScript) + Vite + Tailwind CSS</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="block text-xs text-slate-500">Backend API</span>
              <span className="font-semibold text-slate-800">Spring Boot 4.x (Java 23)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="block text-xs text-slate-500">Database Engine</span>
              <span className="font-semibold text-slate-800">PostgreSQL (Hibernate Auto DDL)</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <p>FixHub — Report. Book. Request. Learn.</p>
          <p>Built with Spring Boot 4 and React</p>
        </div>
      </footer>
    </div>
  )
}

export default App
