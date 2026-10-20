import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Alert({ type = 'error', children }) {
  const isError = type === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2
  return (
    <div
      className={`p-3.5 rounded-xl border text-xs mb-4 flex items-start space-x-2 ${
        isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}