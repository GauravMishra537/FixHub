import React from 'react'
import { Link } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'

export default function ComingSoonPage({ title }) {
  return (
    <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-10 mt-8">
      <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-1 mb-5">This module is being built. It will appear here soon.</p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to dashboard
      </Link>
    </div>
  )
}