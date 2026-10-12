import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { UserPlus, LogIn } from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Fix<span className="text-blue-600">Hub</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs text-slate-500 pl-3 border-l border-slate-200 font-medium">
            Report. Book. Request. Learn.
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4 mr-1.5 text-slate-500" />
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Register
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
