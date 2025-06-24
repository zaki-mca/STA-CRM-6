"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from 'axios'

export type Permission = 
  | 'create:brands'
  | 'read:brands'
  | 'update:brands'
  | 'delete:brands'
  | 'create:categories'
  | 'read:categories'
  | 'update:categories'
  | 'delete:categories'
  | 'create:products'
  | 'read:products'
  | 'update:products'
  | 'delete:products'
  | 'create:orders'
  | 'read:orders'
  | 'update:orders'
  | 'delete:orders'
  | 'create:clients'
  | 'read:clients'
  | 'update:clients'
  | 'delete:clients'
  | 'create:providers'
  | 'read:providers'
  | 'update:providers'
  | 'delete:providers'
  | 'manage:users'
  | 'view:reports'

export type Role = 'admin' | 'manager' | 'user'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          // Validate token with backend
          const response = await axios.get(`${API_URL}/auth/validate`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.data.user) {
            setUser(response.data.user)
          } else {
            throw new Error('Invalid token')
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })

      const { token, user } = response.data
      setUser(user)
      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(user))

      router.push("/")
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Login failed. Please try again." 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
        firstName,
        lastName,
        isAdmin: false // Regular users are not admins by default
      })

      const { token, user } = response.data
      setUser(user)
      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(user))

      router.push("/")
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Registration failed. Please try again." 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to send reset email. Please try again." 
      }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (token) {
        // Notify backend about logout
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local state and redirect regardless of server response
      setUser(null)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      router.push("/auth/login")
    }
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false
  }

  const isAdmin = (): boolean => {
    return user?.isAdmin || false
  }

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    isLoading,
    hasPermission,
    isAdmin
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
