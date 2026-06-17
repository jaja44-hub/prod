import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile overlay open
  const [sidebarExpanded, setSidebarExpanded] = useState(true) // desktop collapsed/expanded
  const hoverTimeout = useRef(null)

  useEffect(() => {
    try {
      const storedOpen = typeof window !== 'undefined' && window.localStorage.getItem('globalSidebarOpen')
      if (storedOpen !== null) setSidebarOpen(storedOpen === 'true')
      const storedExpanded = typeof window !== 'undefined' && window.localStorage.getItem('sidebar-expanded')
      if (storedExpanded !== null) setSidebarExpanded(storedExpanded === 'true')
    } catch (e) {}
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem('globalSidebarOpen', sidebarOpen ? 'true' : 'false') } catch (e) {}
  }, [sidebarOpen])

  useEffect(() => {
    try { window.localStorage.setItem('sidebar-expanded', sidebarExpanded ? 'true' : 'false') } catch (e) {}
    if (typeof document !== 'undefined') {
      if (sidebarExpanded) document.querySelector('body')?.classList.add('sidebar-expanded')
      else document.querySelector('body')?.classList.remove('sidebar-expanded')
    }
  }, [sidebarExpanded])

  const toggle = () => setSidebarOpen((s) => !s)
  const expand = () => setSidebarExpanded(true)
  const collapse = () => setSidebarExpanded(false)

  // temporary hover expand: expands on enter and collapses after short delay on leave
  const hoverExpand = () => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null }
    setSidebarExpanded(true)
  }
  const hoverCollapseDelayed = (delay = 250) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setSidebarExpanded(false), delay)
  }

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggle, sidebarExpanded, setSidebarExpanded, expand, collapse, hoverExpand, hoverCollapseDelayed }}>
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
