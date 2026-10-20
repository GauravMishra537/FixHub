import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCircle,
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  ScrollText,
  Home,
} from 'lucide-react'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/org-setup', label: 'Departments & skills', icon: Building2 },
  { to: '/admin/skill-review', label: 'Skill review', icon: ClipboardCheck },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
]

const USER_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/account', label: 'My account', icon: UserCircle },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `inline-flex items-center whitespace-nowrap px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="w-4 h-4 mr-1.5" />
      {label}
    </NavLink>
  )
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const links = isAdmin ? [...ADMIN_LINKS, { to: '/account', label: 'Account', icon: UserCircle }] : USER_LINKS

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Fix<span className="text-blue-600">Hub</span>
            </span>
          </Link>
          <span className="hidden md:inline-block text-xs text-slate-500 pl-3 border-l border-slate-200 font-medium">
            Report. Book. Request. Learn.
          </span>
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              ADMIN
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {initials(user?.fullName)}
                </div>
                <div className="text-right hidden sm:block leading-tight">
                  <div className="text-xs font-semibold text-slate-800">{user?.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{user?.role}</div>
                </div>
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

      {isAuthenticated && (
        <nav className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavItem key={l.to} {...l} />
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar