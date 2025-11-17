'use client';
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
//import LoginModal from "@/components/LoginModal";
import LoginModalLayer from "@/components/auth/LoginModalLayer";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { UIProvider, useUI } from "@/hooks/useUI";


export default function RootLayout({ children }: { children: React.ReactNode }) {

    return (

        <html lang="id">
            <body className="min-h-screen h-screen w-screen overflow-hidden">
                <AuthProvider>
                    <UIProvider>
                        {children}
                        <LoginModalLayer />
                    </UIProvider>
                </AuthProvider>
            </body>
        </html>

    );
}
