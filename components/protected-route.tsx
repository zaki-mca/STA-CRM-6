"use client"

import type React from "react"
import { useAuth, type Permission, type Role } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requiredRoles?: Role[]
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, hasRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Store the attempted URL to redirect back after login
        sessionStorage.setItem('redirectUrl', pathname)
        router.push("/auth/login")
        return
      }

      // Check role requirements
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        router.push("/unauthorized")
        return
      }

      // Check permission requirements
      if (requiredPermissions.length > 0 && 
          !requiredPermissions.every(permission => hasPermission(permission))) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, isLoading, router, pathname, hasPermission, hasRole, requiredRoles, requiredPermissions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check role and permission requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return null
  }

  if (requiredPermissions.length > 0 && 
      !requiredPermissions.every(permission => hasPermission(permission))) {
    return null
  }

  return <>{children}</>
}
