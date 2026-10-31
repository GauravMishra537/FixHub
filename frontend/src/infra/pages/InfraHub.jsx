import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** The Infra page: a row of tabs, the chosen one fills the space below. */
export default function InfraHub() {
  const { isAdmin } = useAuth()

  const tabs = [
    { to: '/infra', label: 'Infra bookings', end: true },
    { to: '/infra/board', label: 'Infra board' },
    ...(isAdmin
      ? [
          { to: '/infra/requests', label: 'Requests' },
          { to: '/infra/catalog', label: 'Catalog' },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}