'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { clsx } from 'clsx'

export default function Drawer({
    children,
}: {
    children?: React.ReactNode
}) {
    const [open, setOpen] = useState(true)

    return (
        <>
            {/* Tombol burger */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="fixed top-3 left-3 z-[1000] rounded-full p-2 bg-white shadow hover:bg-gray-100"
                aria-label="Toggle menu"
            >
                {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Panel kiri (drawer) */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur border-r border-gray-200 shadow-lg z-[999] transition-transform',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="h-12" />
                <div className="p-4 space-y-3">
                    <h2 className="font-semibold">RambuBencana</h2>
                    <nav className="space-y-1 text-sm">
                        <a className="block px-2 py-1 rounded hover:bg-gray-100" href="#">Dashboard</a>
                        <a className="block px-2 py-1 rounded hover:bg-gray-100" href="#">Data Rambu</a>
                        <a className="block px-2 py-1 rounded hover:bg-gray-100" href="#">Impor Excel</a>
                        <a className="block px-2 py-1 rounded hover:bg-gray-100" href="#">Simulasi</a>
                        <a className="block px-2 py-1 rounded hover:bg-gray-100" href="#">Peta Tsunami</a>
                    </nav>
                    {children}
                </div>
            </aside>
        </>
    )
}
