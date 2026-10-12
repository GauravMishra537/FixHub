import React from 'react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900">FixHub</span>
          <span>•</span>
          <span>Report. Book. Request. Learn.</span>
        </div>
        <div>
          <span>One Platform for All Office Requests</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
