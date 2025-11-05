'use client'

import { useEffect, useRef } from 'react'
import maplibregl, { Map } from 'maplibre-gl'

// Koordinat batas Indonesia
const IDN_BOUNDS: [[number, number], [number, number]] = [
    [94.97, -11.0],  // barat daya
    [141.02, 6.1],   // timur laut
]

export default function FullMap() {
    const mapRef = useRef<Map | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Inisialisasi MapLibre
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [117.5, -2.5],
            zoom: 4,
            attributionControl: false,
        })
        mapRef.current = map

        map.on('load', () => {
            console.log('Peta berhasil dimuat!')

            // 🔷 Warna brand MSCode
            const brandBlue = '#A2BEDB'
            const brandWhite = '#ffffff'

            // Ubah warna dasar daratan
            if (map.getLayer('land')) {
                map.setPaintProperty('land', 'background-color', brandWhite)
            }

            // Ubah warna air (laut/sungai)
            if (map.getLayer('water')) {
                map.setPaintProperty('water', 'fill-color', brandBlue)
            }

            // Ubah warna garis jalan utama (kalau ada layer transportation_major_road)
            const mainRoadLayers = map.getStyle().layers?.filter(l =>
                l.id.includes('road') || l.id.includes('transport')
            )

            if (mainRoadLayers) {
                mainRoadLayers.forEach(layer => {
                    if (layer.type === 'line') {
                        try {
                            map.setPaintProperty(layer.id, 'line-color', brandBlue)
                            map.setPaintProperty(layer.id, 'line-opacity', 0.7)
                        } catch (err) {
                            // abaikan layer yang tidak punya properti line-color
                        }
                    }
                })
            }

            // Label kota / teks agar tetap terbaca di atas layer biru
            const labelLayers = map.getStyle().layers?.filter(
                l => l.type === 'symbol' && l.id.includes('label'),
            )
            if (labelLayers) {
                labelLayers.forEach(layer => {
                    try {
                        map.setPaintProperty(layer.id, 'text-color', '#1e293b') // abu tua
                        map.setPaintProperty(layer.id, 'text-halo-color', brandWhite)
                        map.setPaintProperty(layer.id, 'text-halo-width', 1.5)
                    } catch (err) { }
                })
            }

            // Batas negara atau provinsi
            const boundaryLayers = map.getStyle().layers?.filter(l =>
                l.id.includes('boundary'),
            )
            if (boundaryLayers) {
                boundaryLayers.forEach(layer => {
                    try {
                        map.setPaintProperty(layer.id, 'line-color', '#93c5fd') // biru muda lembut
                    } catch (err) { }
                })
            }

            // Fit ke seluruh Indonesia
            map.fitBounds(IDN_BOUNDS, { padding: 40, duration: 800 })
        })

        // Tambahkan kontrol navigasi (zoom, rotate)
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

        // Cleanup ketika komponen di-unmount
        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

    return (
        <div className="absolute inset-0">
            {/* background fallback (brand color) */}
            <div className="absolute inset-0 bg-[#004AAD]" />
            {/* Floating logo BNPB di kanan-atas */}
            <div className="absolute top-3 right-16 z-20 pointer-events-none">
                <img
                    src="/images/Logo_BNPB.png"
                    alt="BNPB"
                    className="h-15 w-auto drop-shadow-md"
                />
            </div>
            <div ref={containerRef} className="h-full w-full relative z-10" />
            <div className="absolute bottom-3 left-3 z-20 text-white text-xs bg-[#004AAD]/80 px-3 py-1 rounded-md shadow">
                © MScode – Map powered by MapLibre GL
            </div>
        </div>
    )
}
