import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../common/ThemeToggle'
import {
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  ScrollText,
  Home,
  Users,
  Ticket,
  ListChecks,
  Wrench,
  CalendarDays,
  Laptop,
  GraduationCap,
} from 'lucide-react'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/issues', label: 'Issues', icon: Wrench },
  { to: '/admin/rooms', label: 'Rooms', icon: CalendarDays },
  { to: '/admin/resources', label: 'Resources', icon: Laptop },
  { to: '/admin/topics', label: 'Topics', icon: GraduationCap },
  { to: '/admin/org-setup', label: 'Departments & skills', icon: Building2 },
  { to: '/admin/skill-review', label: 'Skill review', icon: ClipboardCheck },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
]

const USER_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/tickets', label: 'All tickets', icon: ListChecks },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `inline-flex items-center whitespace-nowrap px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/10'
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

  const links = isAdmin ? ADMIN_LINKS : USER_LINKS

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={isAdmin ? '/admin' : '/'} className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-white">
                Fix<span className="text-sky-300">Hub</span>
              </span>
            </Link>
            <span className="hidden md:inline-block text-xs text-blue-100 pl-3 border-l border-white/25 font-medium">
              Report. Book. Request. Learn.
            </span>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                ADMIN
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {/* name and avatar open the account page */}
                <NavLink
                  to="/account"
                  title="My account"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 rounded-lg px-2 py-1 transition-colors ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`
                  }
                >
                  <div className="w-9 h-9 rounded-full bg-white text-blue-700 text-xs font-bold flex items-center justify-center">
                    {initials(user?.fullName)}
                  </div>
                  <div className="text-right hidden sm:block leading-tight">
                    <div className="text-xs font-semibold text-white">{user?.fullName}</div>
                    <div className="text-[10px] text-blue-200 font-mono uppercase">{user?.role}</div>
                  </div>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded-lg transition-colors border border-white/30"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-sm font-semibold transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <nav className="bg-blue-800">
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