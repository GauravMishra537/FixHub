import React from 'react'
import { Link } from 'react-router-dom'
import { LogIn, ArrowRight, UserPlus, Info } from 'lucide-react'

export function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to FixHub</h1>
          <p className="mt-1 text-xs text-slate-500">
            Access your office requests, bookings, and dashboard
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 mb-6 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Commit 7 Milestone</span>
            User authentication, session tokens, and protected routes are delivered in Commit 7. You can register your account right now!
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email
            </label>
            <input
              type="email"
              disabled
              placeholder="name@company.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <Link
              to="/register"
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Go to Account Registration
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          <Link to="/" className="text-slate-600 hover:text-slate-900 inline-flex items-center font-medium">
            Back to Home <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
