"use client"

import { createClient } from '@/lib/supabase/client'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: Date
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      })

      if (response.ok) {
        setUser(null)
        // Redirect to home page
        window.location.href = '/'
      } else {
        throw new Error('Failed to sign out')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  useEffect(() => {
    // Initial user fetch
    fetchUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
