'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { useProvinces } from '@/hooks/useCascadingLocations'
import { useRambu, toGeoJSON } from '@/hooks/useRambu'
import { useProvinceGeom } from '@/hooks/useProvinceGeom'
import * as turf from '@turf/turf'
import { Filter, X } from 'lucide-react'

const IDN_BOUNDS = [
    [94.97, -11.0],
    [141.02, 6.1],
]

export default function MapClient() {
    const mapRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [panelOpen, setPanelOpen] = useState(false)
    const [pendingProvStr, setPendingProvStr] = useState('')
    const [activeProvId, setActiveProvId] = useState<number | undefined>(undefined)

    const { data: provinces } = useProvinces()
    const { data: rambu } = useRambu(activeProvId)
    const rambuFC = useMemo(() => toGeoJSON(rambu), [rambu])

    const { data: provGeomRaw } = useProvinceGeom(activeProvId)

    const normalizeGeom = (g: any) => {
        if (!g) return null
        try {
            const v = typeof g === 'string' ? JSON.parse(g) : g
            if (v.type === 'Feature' || v.type === 'FeatureCollection') return v
            if (v.geometry) return { type: 'Feature', geometry: v.geometry, properties: {} }
            return null
        } catch {
            return null
        }
    }

    // ✅ Init Map — CLIENT ONLY
    useEffect(() => {
        if (!containerRef.current) return

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [117.5, -2.5],
            zoom: 4,
        })

        mapRef.current = map

        map.on('load', () => {
            map.addSource('rambu', {
                type: 'geojson',
                data: rambuFC,
                cluster: true,
                clusterMaxZoom: 11,
                clusterRadius: 40,
            })

            map.addLayer({
                id: 'rambu-unclustered',
                type: 'circle',
                source: 'rambu',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#004AAD',
                    'circle-radius': 7,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#fff',
                },
            })

            map.addSource('prov-geom', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            })

            map.addLayer({
                id: 'prov-outline',
                type: 'line',
                source: 'prov-geom',
                paint: { 'line-color': '#ff0055', 'line-width': 2.2 },
            })

            map.fitBounds(IDN_BOUNDS, { padding: 40 })
        })

        return () => map.remove()
    }, [])

    // ✅ Update rambu
    useEffect(() => {
        const map = mapRef.current
        if (!map) return
        const src = map.getSource('rambu')
        if (src) src.setData(rambuFC)
    }, [rambuFC])

    // ✅ Update geom + zoom
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        const src = map.getSource('prov-geom')
        if (!src) return

        if (!activeProvId) {
            src.setData({ type: 'FeatureCollection', features: [] })
            map.fitBounds(IDN_BOUNDS, { padding: 40 })
            return
        }

        const geom = normalizeGeom(provGeomRaw)
        if (geom) {
            src.setData(geom)

            try {
                const bbox = turf.bbox(geom)
                map.fitBounds(
                    [
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[3]],
                    ],
                    { padding: 48, duration: 500 },
                )
            } catch { }
        }
    }, [activeProvId, provGeomRaw])

    return (
        <div className="absolute inset-0">
            {/* MAP */}
            <div ref={containerRef} className="absolute inset-0" />

            {/* Floating Filter */}
            <button
                onClick={() => setPanelOpen(!panelOpen)}
                className="absolute top-16 right-3 bg-white border rounded-full shadow p-2 z-[1000]"
            >
                {panelOpen ? <X size={18} /> : <Filter size={18} />}
            </button>

            {panelOpen && (
                <div className="absolute top-28 right-3 bg-white border rounded-xl shadow p-3 w-[300px] z-[1000]">
                    <label className="block">
                        <span className="text-xs">Provinsi</span>
                        <select
                            value={pendingProvStr}
                            onChange={e => setPendingProvStr(e.target.value)}
                            className="w-full border rounded px-2 py-2 text-sm"
                        >
                            <option value="">Semua provinsi</option>
                            {provinces?.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        onClick={() => setActiveProvId(pendingProvStr ? Number(pendingProvStr) : undefined)}
                        className="w-full mt-3 bg-[#004AAD] text-white py-2 rounded"
                    >
                        Tampilkan
                    </button>
                </div>
            )}
        </div>
    )
}
