'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextValue {
  apiKey: string | null
  role: 'ADMIN' | 'USER' | null
  login: (key: string, role: 'ADMIN' | 'USER') => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  apiKey: null,
  role: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [role, setRole] = useState<'ADMIN' | 'USER' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey')
    const storedRole = localStorage.getItem('apiRole') as 'ADMIN' | 'USER' | null
    if (storedKey && storedRole) {
      setApiKey(storedKey)
      setRole(storedRole)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!apiKey && pathname !== '/login') {
      router.replace('/login')
    }
    if (apiKey && pathname === '/login') {
      router.replace('/dashboard/locations')
    }
  }, [apiKey, isLoading, pathname, router])

  const login = useCallback((key: string, role: 'ADMIN' | 'USER') => {
    localStorage.setItem('apiKey', key)
    localStorage.setItem('apiRole', role)
    setApiKey(key)
    setRole(role)
    router.replace('/dashboard/locations')
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('apiKey')
    localStorage.removeItem('apiRole')
    setApiKey(null)
    setRole(null)
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ apiKey, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
