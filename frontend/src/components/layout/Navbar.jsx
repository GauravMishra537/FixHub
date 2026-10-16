import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UserPlus, LogIn, LogOut, ShieldCheck, UserCircle } from 'lucide-react'

export function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

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
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Admin Console
                </Link>
              )}

              <Link
                to="/account"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <UserCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Account
              </Link>

              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">{user?.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">{user?.role}</div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <LogOut className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Sign out
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar