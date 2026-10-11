import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSystemInfo } from '../../api/system'
import { CheckCircle, AlertCircle, Menu, X, ShieldCheck } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: system, isLoading, isError } = useQuery({
    queryKey: ['system-info'],
    queryFn: getSystemInfo,
    retry: 1,
  })

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-slate-900">FixHub</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              v0.1.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-600">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Overview
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <span className="text-slate-500">API Status:</span>
            {isLoading ? (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Connecting...
              </span>
            ) : isError ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3 h-3" />
                <span>Offline</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                <span>Connected ({system?.status})</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Role-Based Auth Ready</span>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 pt-2 pb-4 bg-white space-y-2">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            Overview
          </NavLink>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>API Status:</span>
            {isLoading ? 'Connecting...' : isError ? 'Offline' : `Connected (${system?.status})`}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
