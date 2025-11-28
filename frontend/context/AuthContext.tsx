"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'

interface User {
    id: number
    email: string
    role: 'admin' | 'recruiter' | 'candidate'
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (token: string, refreshToken: string, user: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for token and load user
        const token = localStorage.getItem('access_token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = (token: string, refreshToken: string, userData: User) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)

        if (userData.role === 'admin') {
            router.push('/admin/dashboard')
        } else {
            router.push('/dashboard')
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
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
