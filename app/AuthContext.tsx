'use client'
import { createContext, useContext, useState, useEffect } from "react"

interface User {
    id: number
    name: string
    username: string
    role: number
    satker_id?: number | null
    token: string
}

interface AuthContextProps {
    user: User | null
    login: (u: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    login: () => { },
    logout: () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem("auth_user")
        if (saved) setUser(JSON.parse(saved))
    }, [])

    function login(u: User) {
        setUser(u)
        localStorage.setItem("auth_user", JSON.stringify(u))
    }

    function logout() {
        setUser(null)
        localStorage.removeItem("auth_user")
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
