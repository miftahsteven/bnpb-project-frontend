// app/(main)/rambu/page.tsx
'use client'

import RambuTable from "@/components/RambuTable";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/auth/LoginModal";

export default function RambuPage() {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <LoginModal />;

    return (
        <div className="h-full w-full p-4 overflow-y-auto max-h-[95vh]">
            <div className="max-w-[1400px] mx-auto">
                {/* <h1 className="text-xl font-semibold mb-3">Data Rambu</h1> */}
                <RambuTable />
            </div>
        </div>
    );
}
