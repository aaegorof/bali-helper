import { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  currentUser: string | null
  recentUsers: string[]
  login: (email: string) => void
  logout: () => void
  switchUser: (email: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const MAX_RECENT_USERS = 5

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(() => 
    localStorage.getItem('currentUser')
  )
  const [recentUsers, setRecentUsers] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem('recentUsers') || '[]')
  )

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', currentUser)
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem('recentUsers', JSON.stringify(recentUsers))
  }, [recentUsers])

  const login = (email: string) => {
    setCurrentUser(email)
    setRecentUsers(prev => {
      const filtered = prev.filter(u => u !== email)
      return [email, ...filtered].slice(0, MAX_RECENT_USERS)
    })
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const switchUser = (email: string) => {
    login(email)
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      recentUsers,
      login,
      logout,
      switchUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 