"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/protected-route"
import ErrorBanner from "@/components/ErrorBanner"

interface AppContentProps {
  children: React.ReactNode
}

export function AppContent({ children }: AppContentProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Check if current path is an auth page
  const isAuthPage = pathname?.startsWith("/auth/")

  // If it's an auth page, render without sidebar/header
  if (isAuthPage) {
    return <>{children}</>
  }

  // For all other pages, require authentication and show full layout
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onSearch={() => {}} searchPlaceholder="Search across your CRM..." />
          <div className="px-4 md:px-6 pt-2">
            <ErrorBanner />
          </div>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
