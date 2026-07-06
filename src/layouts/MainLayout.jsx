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
      <main className={`w-full transition-all duration-200 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="mx-auto w-full max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-6">
          <Outlet />
        </div>
      </main>
    </>
  )
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="app-root min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <LayoutContent />
        </div>
      </div>
    </SidebarProvider>
  )
}
