import React from 'react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
        <div>
          <span className="font-semibold text-slate-700">FixHub</span>
          <span className="mx-2">•</span>
          <span>Report. Book. Request. Learn.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Spring Boot 4.x (Java 23)</span>
          <span>•</span>
          <span>PostgreSQL</span>
          <span>•</span>
          <span>React 18</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
