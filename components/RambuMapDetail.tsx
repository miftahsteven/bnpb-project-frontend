import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";

type RambuDetail = {
    id: string | number;
    name?: string;
    description?: string;
    lat: number;
    lng: number;
    // add other fields if needed
};

type RambuMapDetailProps = {
    open: boolean;
    id: string | number;
    onClose: () => void;
};


const RambuMapDetail: React.FC<RambuMapDetailProps> = ({ id, onClose }) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<RambuDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'BSMSxOeDudgubp5q2uYq'

    // Fetch rambu detail
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        const fetchDetail = async () => {
            try {
                const auth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null
                const token = auth ? JSON.parse(auth).token : null
                const res = await fetch(`${base}/api/rambu-map-detail/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error(`Gagal mengambil detail rambu: ${res.status}`);
                const data = (await res.json()) as RambuDetail;
                console.log(JSON.stringify(data));

                if (!active) return;
                if (
                    typeof data?.lat !== "number" ||
                    typeof data?.lng !== "number"
                ) {
                    throw new Error("Data lokasi rambu tidak valid");
                }
                setDetail(data);
            } catch (e: any) {
                if (!active) return;
                setError(e?.message || "Terjadi kesalahan");
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchDetail();
        return () => {
            active = false;
        };
    }, [id]);

    // Init map when detail is available
    useEffect(() => {
        if (!detail || !mapContainerRef.current) return;

        // Clean previous map if any
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        const center: [number, number] = [detail.lng, detail.lat];
        const styleUrl = `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
            center,
            zoom: 6, // between 12-13
            // Disable interactions
            interactive: true,
        });

        // Explicitly disable interaction handlers in case style enables them
        //map.scrollZoom?.disable();
        map.boxZoom?.disable();
        map.dragRotate?.disable();
        //map.dragPan?.disable();
        map.keyboard?.disable();
        map.doubleClickZoom?.disable();
        map.touchZoomRotate?.disable();

        mapRef.current = map;

        map.on("load", () => {
            // Place marker at center
            const marker = new maplibregl.Marker({ color: "#d62828" }).setLngLat(center).addTo(map);
            markerRef.current = marker;

            // Ensure the center remains focused
            map.setCenter(center);
            map.setZoom(5.5);
        });

        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, [detail]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rambu-map-detail-title"
            className="fixed inset-0 z-[2100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Modal content */}
            <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h2 id="rambu-map-detail-title" className="text-lg font-semibold">
                        Detail Lokasi Rambu
                    </h2>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded px-2 py-1 text-sm border hover:bg-gray-100"
                        aria-label="Tutup"
                    >
                        Tutup
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {loading && <div className="text-sm text-gray-600">Memuat data lokasi…</div>}
                    {error && <div className="text-sm text-red-600">Error: {error}</div>}
                    {!loading && !error && detail && (
                        <>
                            <div className="text-sm">
                                <div className="font-medium">{detail.name || `Rambu #${detail.id}`}</div>
                                {detail.description && (
                                    <div className="text-gray-600">{detail.description}</div>
                                )}
                                <div className="text-gray-600">
                                    Koordinat: {detail.lat}, {detail.lng}
                                </div>
                            </div>
                            <div className="w-full h-80 rounded border overflow-hidden">
                                <div ref={mapContainerRef} className="w-full h-full" />
                            </div>
                            <div className="text-xs text-gray-500">
                                Interaksi peta dinonaktifkan. Zoom dikunci pada 12.5 dan marker berada di tengah.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RambuMapDetail;