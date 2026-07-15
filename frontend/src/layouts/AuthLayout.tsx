import * as React from "react"
import { Outlet } from "react-router-dom"
import logoImage from "@/assets/logo.png"

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-elevated border border-border overflow-hidden">
            <img src={logoImage} alt="ForgeOps Logo" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="text-2xl font-mono tracking-tight text-text-primary">
            ForgeOps AI
          </h2>
        </div>

        <Outlet />

        <div className="text-center text-xs text-text-muted mt-8">
          &copy; {new Date().getFullYear()} ForgeOps Intelligence Platform. All rights reserved.
        </div>
      </div>
    </div>
  )
}
