"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type AuthUser = {
    id: number;
    name?: string | null;
    username?: string | null;
    role?: number | null;
    satker_id?: number | null;
    satker_name?: string | null;
};

type AuthContextValue = {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    bearerFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    loginModalOpen: boolean;
    setLoginModalOpen: (v: boolean) => void;
    loginFromResponse: (json: any) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("auth");
            //console.log("AuthProvider: loaded auth from localStorage", raw);

            if (raw) {
                const { user: u, token: t } = JSON.parse(raw);
                if (t) setToken(t);
                if (u) setUser(u);
            }
        } catch { }
        setLoading(false);
    }, []);

    const persist = useCallback((u: AuthUser | null, t: string | null) => {
        setUser(u);
        setToken(t);
        if (u && t) {
            localStorage.setItem("auth", JSON.stringify({ user: u, token: t }));
        } else {
            localStorage.removeItem("auth");
        }
    }, []);


    const login = useCallback(
        async (username: string, password: string) => {
            const res = await fetch(`${API_BASE}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e?.error || `Login gagal (HTTP ${res.status})`);
            }

            const json = await res.json();
            const u: AuthUser = {
                id: json.id,
                name: json.name,
                username: json.username,
                role: json.role,
                satker_id: json.satker_id,
                satker_name: json.satker_name,
            };

            persist(u, json.token || null);
            setUser(u);
            setToken(json.token);
        },
        [persist]
    );

    const logout = useCallback(async () => {
        try {
            if (token) {
                await fetch(`${API_BASE}/api/users/logout`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch { }
        persist(null, null);
    }, [token, persist]);

    const bearerFetch = useCallback(
        (input: RequestInfo | URL, init: RequestInit = {}) => {
            const headers = new Headers(init.headers || {});
            if (token) headers.set("Authorization", `Bearer ${token}`);
            return fetch(input, { ...init, headers });
        },
        [token]
    );

    const loginFromResponse = useCallback((json: any) => {
        const u: AuthUser = {
            id: json.id,
            name: json.name,
            username: json.username,
            role: json.role,
            satker_id: json.satker_id,
            satker_name: json.satker_name ?? null,
        };
        persist(u, json.token || null);
    }, [persist]);

    // const value = useMemo(
    //     () => ({ user, token, loading, login, logout, bearerFetch }),
    //     [user, token, loading, login, logout, bearerFetch]
    // );

    const value = useMemo<AuthContextValue>(
        () => ({
            user, token, loading,
            login, logout, bearerFetch,
            loginModalOpen,
            setLoginModalOpen,
            loginFromResponse
        }),
        [user, token, loading, login, logout, bearerFetch, loginModalOpen, setLoginModalOpen, loginFromResponse]
    );



    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
