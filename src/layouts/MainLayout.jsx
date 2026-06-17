import React, { useEffect, useState } from 'react'
import Sidebar from '../partials/Sidebar'
import Header from '../partials/Header'

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

      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="max-w-[1200px] mx-auto p-4 pt-6">
        {children}
      </main>
    </div>
  )
}
