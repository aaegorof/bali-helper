"use client"
import { loginUser } from '@/services/api';
import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  recentUsers: User[];
  login: (email: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

const MAX_RECENT_USERS = 5

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [recentUsers, setRecentUsers] = useState<User[]>(() => 
    JSON.parse(localStorage.getItem('recentUsers') || '[]')
  )

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem('recentUsers', JSON.stringify(recentUsers))
  }, [recentUsers])

  const login = async (email: string) => {
    try {
      const userData = await loginUser(email);
      setCurrentUser(userData);
      setRecentUsers(prev => {
        const filtered = prev.filter(u => u.email !== email);
        return [userData, ...filtered].slice(0, MAX_RECENT_USERS);
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const switchUser = async (email: string) => {
    await login(email);
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