"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

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
          // Simulate API call to validate token
          await new Promise((resolve) => setTimeout(resolve, 500))
          const userData = localStorage.getItem("user_data")
          if (userData) {
            setUser(JSON.parse(userData))
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation - in real app, this would be an API call
      if (email === "admin@example.com" && password === "password") {
        const userData = {
          id: "1",
          name: "Admin User",
          email: email,
        }

        setUser(userData)
        localStorage.setItem("auth_token", "mock_token_" + Date.now())
        localStorage.setItem("user_data", JSON.stringify(userData))

        router.push("/")
        return { success: true }
      } else {
        return { success: false, error: "Invalid email or password" }
      }
    } catch (error) {
      return { success: false, error: "Login failed. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock registration - in real app, this would be an API call
      const userData = {
        id: Date.now().toString(),
        name: name,
        email: email,
      }

      setUser(userData)
      localStorage.setItem("auth_token", "mock_token_" + Date.now())
      localStorage.setItem("user_data", JSON.stringify(userData))

      router.push("/")
      return { success: true }
    } catch (error) {
      return { success: false, error: "Registration failed. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock password reset
      return { success: true }
    } catch (error) {
      return { success: false, error: "Failed to send reset email. Please try again." }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    router.push("/auth/login")
  }

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
