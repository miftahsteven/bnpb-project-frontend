// app/(main)/layout.tsx

import Drawer from "@/components/Drawer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-screen overflow-hidden">
            {/* Drawer fixed di kiri */}
            <Drawer />

            {/* Wrapper konten */}
            <div
                className="
                    min-h-screen 
                    w-full 
                    overflow-hidden 
                    pl-72      /* bagian ini penting */
                    bg-gray-50
                "
            >
                {children}
            </div>
        </div>
    );
}
