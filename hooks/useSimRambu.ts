"use client";

import { useEffect, useState } from "react";

export type SimPoint = {
    id: string;
    lng: number;
    lat: number;
    createdAt: number;
};

export function useSimRambu() {
    const [points, setPoints] = useState<SimPoint[]>([]);

    // Load dari localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem("sim-rambu");
            if (raw) setPoints(JSON.parse(raw));
        } catch { }
    }, []);

    // Simpan ke localStorage
    const persist = (list: SimPoint[]) => {
        setPoints(list);
        localStorage.setItem("sim-rambu", JSON.stringify(list));
    };

    const addPoint = (lng: number, lat: number) => {
        const p: SimPoint = {
            id: crypto.randomUUID(),
            lng,
            lat,
            createdAt: Date.now(),
        };
        persist([...points, p]);
    };

    const clear = () => persist([]);

    return { points, addPoint, clear };
}
