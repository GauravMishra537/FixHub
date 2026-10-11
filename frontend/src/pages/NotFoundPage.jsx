import React from 'react'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">404 Error</p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
        The requested resource or page could not be located in FixHub.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
