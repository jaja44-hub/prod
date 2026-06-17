import React from 'react'
import Sidebar from '../partials/Sidebar'
import Header from '../partials/Header'
import { SidebarProvider } from '../context/SidebarContext'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="app-root min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />

        <Header />

        <main className="max-w-[1200px] mx-auto p-4 pt-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
