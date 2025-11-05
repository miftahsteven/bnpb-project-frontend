import './globals.css'
import 'maplibre-gl/dist/maplibre-gl.css'  // <- penting
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Rambu Bencana',
    description: 'Sistem Manajemen Rambu Bencana',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id" className="h-full">
            <body className="h-full">{children}</body>
        </html>
    )
}
