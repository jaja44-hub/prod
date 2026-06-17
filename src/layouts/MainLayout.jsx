import React from 'react'
import Sidebar from '../partials/Sidebar'
import Header from '../partials/Header'
import { SidebarProvider, useSidebar } from '../context/SidebarContext'
import { Outlet } from 'react-router-dom'

function LayoutContent() {
  const { sidebarExpanded } = useSidebar()
  return (
    <>
      <Header />
      <main className={`w-full transition-all duration-200 p-4 pt-6 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Outlet />
      </main>
    </>
  )
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="app-root min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <LayoutContent />
      </div>
    </SidebarProvider>
  )
}
