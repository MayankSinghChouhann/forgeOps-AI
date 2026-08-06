import * as React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
