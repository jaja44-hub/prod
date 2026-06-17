import React, { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' && window.localStorage.getItem('globalSidebarOpen')
      if (stored !== null) setSidebarOpen(stored === 'true')
    } catch (e) {}
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem('globalSidebarOpen', sidebarOpen ? 'true' : 'false') } catch (e) {}
  }, [sidebarOpen])

  const toggle = () => setSidebarOpen((s) => !s)

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

export default SidebarContext
