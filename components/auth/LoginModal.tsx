'use client'

import { useState } from 'react'
//import { useAuth } from '@/app/AuthContext'
import { useAuth } from '@/hooks/useAuth';


export default function LoginModal({ open, onClose }: { open: boolean, onClose: () => void }) {
    const { login, loginFromResponse, setLoginModalOpen } = useAuth();
    const [username, setUser] = useState("")
    const [password, setPass] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null

    async function handleLogin(e: any) {
        e.preventDefault()
        setError("")

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"

        try {
            const res = await fetch(`${API_BASE}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Login gagal")
                return
            }
            loginFromResponse(data);
            setLoginModalOpen(false);
            // reset form
            setUser("");
            setPass("");
            //login(data)
            onClose()
        } catch (e) {
            setError("Gagal login")
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                <h2 className="text-lg font-semibold text-center mb-4">Login Aplikasi BNPB</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm">Username</label>
                        <input className="w-full border rounded px-3 py-2"
                            value={username} onChange={e => setUser(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-sm">Password</label>
                        <input type="password"
                            className="w-full border rounded px-3 py-2"
                            value={password} onChange={e => setPass(e.target.value)} />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-[#004AAD] text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>

                <button onClick={onClose}
                    className="mt-3 w-full text-center text-sm text-gray-500">
                    Tutup
                </button>
            </div>
        </div>
    )
}
