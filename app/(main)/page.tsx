'use client';

// app/(main)/page.tsx
import dynamic from "next/dynamic";

// FullMap pakai 'use client' di dalam komponennya
const FullMap = dynamic(() => import("@/components/FullMap"), { ssr: false });
//const FullMap = dynamic(() => import("@/components/FullMapNG"), { ssr: false });

export default function Page() {
    return <FullMap />;
}
