import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, CalendarDays, Laptop, GraduationCap, ChevronRight } from 'lucide-react'

// the four ticket types. soon: true shows a small "Soon" mark until that module is built
const TYPES = [
  {
    to: '/issues/new',
    title: 'Issue Ticket',
    text: 'Report a workplace or IT problem',
    icon: Wrench,
    box: 'bg-red-50 border-red-200 hover:border-red-400',
    iconBox: 'bg-red-100 text-red-600',
  },
  {
    to: '/rooms',
    title: 'Room Booking',
    text: 'Book a meeting room',
    icon: CalendarDays,
    box: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconBox: 'bg-blue-100 text-blue-600',
    soon: true,
  },
  {
    to: '/resources',
    title: 'Resource Request',
    text: 'Ask for laptops, projectors, monitors',
    icon: Laptop,
    box: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconBox: 'bg-emerald-100 text-emerald-600',
    soon: true,
  },
  {
    to: '/topics',
    title: 'Topic Request',
    text: 'Ask a colleague to teach you',
    icon: GraduationCap,
    box: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    iconBox: 'bg-amber-100 text-amber-600',
    soon: true,
  },
]

export default function TicketTypeTiles() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TYPES.map(({ to, title, text, icon: Icon, box, iconBox, soon }) => (
        <Link
          key={title}
          to={to}
          className={`group relative flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-md ${box}`}
        >
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBox}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{title}</span>
            <span className="block truncate text-xs text-slate-500">{text}</span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-700" />
          {soon && (
            <span className="absolute right-2 top-2 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
              Soon
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}