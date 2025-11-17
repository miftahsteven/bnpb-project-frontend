"use client";
import { createContext, useContext, useState } from "react";

const UIContext = createContext<any>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
    // ✅ default HARUS false agar tidak muncul pertama kali
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    return (
        <UIContext.Provider value={{ loginModalOpen, setLoginModalOpen }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useUI must be used within <UIProvider>");
    return ctx;
}
