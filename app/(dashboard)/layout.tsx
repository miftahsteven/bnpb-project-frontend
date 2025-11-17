'use client';

import Drawer from "@/components/Drawer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex w-full h-screen overflow-hidden">
            {/* Drawer di kiri */}
            <Drawer />

            {/* Area konten kanan */}
            <main className="flex-1 relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
