import React, { useEffect, useState } from 'react'
import Sidebar from '../partials/Sidebar'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' && window.localStorage.getItem('globalSidebarOpen')
    if (stored !== null) setSidebarOpen(stored === 'true')
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem('globalSidebarOpen', sidebarOpen ? 'true' : 'false') } catch (e) {}
  }, [sidebarOpen])

  return (
    <div className="app-root min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button aria-label="Toggle sidebar" onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <div className="text-lg font-semibold">Production</div>
          </div>
          <div className="flex items-center gap-3">
            {/* placeholder for header actions */}
            <div className="text-sm text-gray-500">v3.0</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 pt-6">
        {children}
      </main>
    </div>
  )
}
