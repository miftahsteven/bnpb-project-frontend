'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import Image from 'next/image'

//import LoginModal from "@/components/auth/LoginModal";

export default function Drawer() {
    const [open, setOpen] = useState(true);
    const { user, loading, logout } = useAuth()
    const { setLoginModalOpen } = useUI();
    const [showLogin, setShowLogin] = useState(false)

    // useEffect(() => {
    //     if (!user) setLoginModalOpen(true)
    // }, [user]);

    //console.log('user in drawer', user?.role);


    if (loading) return null;

    return (
        <>
            {/* Burger */}
            <button
                onClick={() => setOpen(v => !v)}
                className="fixed top-3 left-3 z-[1000] rounded-full p-2 bg-white shadow hover:bg-gray-100"
                aria-label="Toggle menu"
            >
                {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Panel kiri */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur border-r border-gray-200 shadow-lg z-[999] transition-transform",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-12" />
                {/* letakan logo BNPB disini */}
                <div className="p-4 border-b border-gray-200">
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-1 justify-items-center'>
                        <Link href="/">
                            <img src="/images/logo_BNPB.png" alt="BNPB Logo" width={150} height={50} className="h-10 w-auto" />
                        </Link>
                        <span className="self-center font-bold text-lg text-center">Sistem Informasi Rambu Bencana</span>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <h2 className="font-semibold">Rambu Bencana</h2>
                    <nav className="space-y-1 text-sm">
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/">Peta (FullMap)</Link>
                        {user && (
                            <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/rambu">Data Rambu</Link>
                        )}
                        {/* <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/impor">Impor Excel</Link> */}
                        {/* <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/simulasi">Simulasi</Link> */}
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/tsunami">Peta Tsunami</Link>
                        {user && user?.role === 1 && (
                            <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/users">
                                User Management
                            </Link>
                        )}
                        {!user && (
                            <button
                                onClick={() => setLoginModalOpen(true)}
                                className="block px-2 py-1 rounded hover:bg-gray-100"
                            >
                                Login
                            </button>
                        )}
                    </nav>
                    {user && (
                        <div className="px-4 py-3 bg-blue-50 rounded-md text-sm border border-blue-200 mb-4 space-y-2">
                            <div className="font-semibold text-blue-800">
                                {user.name || user.username}
                            </div>
                            <div className="text-blue-600 text-xs">
                                Satker: {user.satker_name ?? "-"}
                            </div>

                            <button
                                onClick={logout}
                                className="w-full mt-2 py-1 text-center rounded bg-red-600 text-white text-xs hover:bg-red-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                    {/* buatkan filter menu dibawah dengan Link, untuk peta data Tsunami, Gempa Bumi, Banjir, dan semua jenis bencana. Tambahkan Icon di depan text menu */}
                    {/* <nav className="space-y-1 text-sm pt-4 border-t border-gray-200">
                        <h3 className="font-semibold">Filter Bencana</h3>
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/filter/tsunami">🌊 Tsunami</Link>
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/filter/gempa-bumi">🌍 Gempa Bumi</Link>
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/filter/banjir">🌧️ Banjir</Link>
                        <Link className="block px-2 py-1 rounded hover:bg-gray-100" href="/filter/semua">📋 Semua Jenis Bencana</Link>
                    </nav> */}
                </div>
                {/* {showLogin && (
                    <LoginModal
                        open={showLogin}
                        onClose={() => setShowLogin(false)}
                    />
                )} */}
            </aside>
        </>
    );
}
