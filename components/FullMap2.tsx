'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as turf from '@turf/turf'
import { Filter, X, Loader2, Menu } from 'lucide-react'
import { useProvinces } from '@/hooks/useCascadingLocations'
import { useRambu, toGeoJSON } from '@/hooks/useRambu'
import { useProvinceGeom } from '@/hooks/useProvinceGeom' // <- dipakai untuk bbox saja
// ========================
// KONSTANTA
// ========================
const IDN_BOUNDS: [[number, number], [number, number]] = [
    [94.97, -11.0],
    [141.02, 6.1],
]

const BRAND_BLUE = '#004AAD'
const DEFAULT_COLOR = BRAND_BLUE
const COLOR_BY_DISASTER: Record<number, string> = {
    1: '#ef4444',
    2: '#f59e0b',
    3: '#22c55e',
    4: '#3b82f6',
}

const HIGHLIGHT_COLOR = '#f97316' // oranye


// helper: normalisasi GeoJSON dari API untuk dipakai bbox (tanpa render)
function toFeature(g: any) {
    return { type: 'Feature', geometry: g, properties: {} as any }
}
function normalizeGeoJSON(input: any): any | null {
    try {
        const v = typeof input === 'string' ? JSON.parse(input) : input
        if (!v) return null
        const t = v.type
        if (t === 'Feature' || t === 'FeatureCollection' || t === 'GeometryCollection') return v
        if (t === 'Polygon' || t === 'MultiPolygon' || t === 'LineString' || t === 'MultiLineString') return toFeature(v)
        if ((v as any).geometry?.type) return toFeature((v as any).geometry)
        return null
    } catch {
        return null
    }
}

export default function FullMap() {
    const mapRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    // UI state
    const [panelOpen, setPanelOpen] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(true)
    const [pendingProvStr, setPendingProvStr] = useState<string>('')
    const [activeProvId, setActiveProvId] = useState<number | undefined>(undefined)
    const [refreshSeq, setRefreshSeq] = useState(0) // <- paksa refresh zoom walau prov tidak berubah

    // data
    const { data: provinces } = useProvinces()
    //const { data: rambu, loading: loadingRambu } = useRambu(activeProvId)
    //const { data: rambuAll, loading: loadingRambu } = useRambu(undefined)
    // const { data: rambuData, loading: loadingRambu, mutate: refetchRambu } = useRambu(
    //     activeProvId,
    //     { fetchAllWhenUndefined: true, forceAll: false }
    // )
    const {
        data: rambuData,
        loading: loadingRambu,
        mutate: refetchRambu,
        error: rambuError,
    } = useRambu(undefined, { fetchAllWhenUndefined: true, forceAll: true })

    //const rambuFC = useMemo(() => toGeoJSON(rambu), [rambu])

    // const rambuFiltered = useMemo(
    //     () =>
    //         activeProvId != null && rambuData && rambuData.length
    //             ? rambuData.filter((f: any) => f.provinceId === activeProvId)
    //             : rambuData,
    //     [rambuData, activeProvId]
    // )

    const { data: provGeomRaw, loading: loadingGeom } = useProvinceGeom(activeProvId)

    const normalizedProvGeom = useMemo(() => {
        if (!activeProvId) return null
        return normalizeGeoJSON(provGeomRaw)
    }, [provGeomRaw, activeProvId])

    // Helper: pastikan target polygon FeatureCollection untuk pointsWithinPolygon
    function toPolygonFeatureCollection(g: any): any | null {
        if (!g) return null
        if (g.type === 'FeatureCollection') return g
        if (g.type === 'Feature') {
            if (g.geometry?.type?.includes('Polygon')) return { type: 'FeatureCollection', features: [g] }
            return null
        }
        if (g.type?.includes('Polygon')) {
            return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: g, properties: {} }] }
        }
        return null
    }

    const rambuFiltered = useMemo(() => {
        if (!rambuData) return []
        // Nasional (tanpa provinsi terpilih)
        if (!activeProvId) return rambuData

        // Jika geom tersedia → filter spasial (lebih akurat)
        const polyFC = toPolygonFeatureCollection(normalizedProvGeom)
        if (polyFC) {
            try {
                const pointsFC = toGeoJSON(rambuData) as any
                const within = turf.pointsWithinPolygon(pointsFC, polyFC)
                return within.features.map((f: any) => f.properties)
            } catch (e) {
                console.warn('[FullMap] Spatial filter gagal, fallback ke provinceId:', e)
                return rambuData.filter((r: any) => r.provinceId === activeProvId)
            }
        }
        // Geom belum siap → fallback metadata provinceId
        return rambuData.filter((r: any) => r.provinceId === activeProvId)
    }, [rambuData, activeProvId, normalizedProvGeom])

    const rambuFC = useMemo(() => toGeoJSON(rambuFiltered), [rambuFiltered])
    // geom dipakai HANYA untuk zoom (tidak digambar)    
    //const { data: provGeomRaw, loading: loadingGeom } = useProvinceGeom(activeProvId, { enabled: !!activeProvId })
    const loadingAny = loadingRambu || (activeProvId ? loadingGeom : false)
    //const loadingAny = loadingRambu || loadingGeom
    const showDetailedLoader = loadingAny && refreshSeq === 0

    // INIT MAP (tanpa layer geom)
    useEffect(() => {
        let alive = true
            ; (async () => {
                if (!containerRef.current) return
                const maplibregl = (await import('maplibre-gl')).default
                const styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                const fallbackStyle = 'https://demotiles.maplibre.org/style.json'

                const map = new maplibregl.Map({
                    container: containerRef.current!,
                    style: styleUrl,
                    center: [117.5, -2.5],
                    zoom: 4,
                })
                mapRef.current = map

                map.on('error', (e: any) => {
                    const msg = String(e?.error || '')
                    if (msg.includes('style') || msg.includes('Failed') || msg.includes('Network')) {
                        try {
                            ; (map as any).setStyle(fallbackStyle)
                        } catch { }
                    }
                })

                map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

                map.on('load', () => {
                    if (!alive) return

                    // source & layers: rambu (cluster + unclustered)
                    if (!map.getSource('rambu')) {
                        map.addSource('rambu', {
                            type: 'geojson',
                            data: rambuFC as any,
                            cluster: true,
                            clusterMaxZoom: 11,
                            clusterRadius: 40,
                        })
                    }
                    if (!map.getLayer('rambu-clusters')) {
                        map.addLayer({
                            id: 'rambu-clusters',
                            type: 'circle',
                            source: 'rambu',
                            filter: ['has', 'point_count'],
                            paint: {
                                'circle-color': [
                                    'step',
                                    ['get', 'point_count'],
                                    '#90caf9',
                                    20,
                                    '#42a5f5',
                                    50,
                                    '#1e88e5',
                                    100,
                                    BRAND_BLUE,
                                ],
                                'circle-radius': ['step', ['get', 'point_count'], 14, 20, 18, 50, 24, 100, 32],
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#fff',
                            },
                        })
                    }
                    if (!map.getLayer('rambu-cluster-count')) {
                        map.addLayer({
                            id: 'rambu-cluster-count',
                            type: 'symbol',
                            source: 'rambu',
                            filter: ['has', 'point_count'],
                            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
                            paint: { 'text-color': '#001b44' },
                        })
                    }
                    if (!map.getLayer('rambu-unclustered')) {
                        map.addLayer({
                            id: 'rambu-unclustered',
                            type: 'circle',
                            source: 'rambu',
                            filter: ['!', ['has', 'point_count']],
                            paint: {
                                'circle-color': [
                                    'coalesce',
                                    [
                                        'case',
                                        ['==', ['typeof', ['get', 'disasterTypeId']], 'number'],
                                        [
                                            'match',
                                            ['get', 'disasterTypeId'],
                                            1,
                                            COLOR_BY_DISASTER[1],
                                            2,
                                            COLOR_BY_DISASTER[2],
                                            3,
                                            COLOR_BY_DISASTER[3],
                                            4,
                                            COLOR_BY_DISASTER[4],
                                            DEFAULT_COLOR,
                                        ],
                                        DEFAULT_COLOR,
                                    ],
                                    DEFAULT_COLOR,
                                ],
                                'circle-radius': 7,
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#fff',
                            },
                        })
                    }

                    // popup & cluster expansion
                    map.on('click', 'rambu-unclustered', (e: any) => {
                        const f = e.features?.[0]
                        if (!f) return
                        const p = f.properties as any
                        new maplibregl.Popup({ offset: 12 })
                            .setLngLat((f.geometry as any).coordinates as [number, number])
                            .setHTML(
                                `<div style="min-width:220px">
                <div style="font-weight:600;margin-bottom:4px">${p.name ?? 'Rambu'}</div>
                ${p.description ? `<div style="font-size:12px;color:#555">${p.description}</div>` : ''}
                ${p.image ? `<div style="margin-top:8px"><img src="${p.image}" alt="foto" style="width:100%;height:auto;border-radius:6px;"/></div>` : ''}
              </div>`
                            )
                            .addTo(map)
                    })
                    map.on('click', 'rambu-clusters', (e: any) => {
                        const feats = map.queryRenderedFeatures(e.point, { layers: ['rambu-clusters'] })
                        const clusterId = feats[0]?.properties?.cluster_id
                        const src = map.getSource('rambu') as any
                        src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                            if (err) return
                            map.easeTo({ center: (feats[0].geometry as any).coordinates, zoom })
                        })
                    })

                    // Source & layers: highlight provinsi terpilih
                    if (!map.getSource('prov-geom')) {
                        map.addSource('prov-geom', {
                            type: 'geojson',
                            data: { type: 'FeatureCollection', features: [] } as any,
                        })
                    }
                    if (!map.getLayer('prov-highlight-fill')) {
                        const beforeId = map.getLayer('rambu-clusters') ? 'rambu-clusters' : undefined
                        map.addLayer({
                            id: 'prov-highlight-fill',
                            type: 'fill',
                            source: 'prov-geom',
                            paint: {
                                'fill-color': HIGHLIGHT_COLOR,
                                'fill-opacity': 0.28,
                            },
                        }
                            , beforeId)
                    }
                    if (!map.getLayer('prov-highlight-outline')) {
                        const beforeId = map.getLayer('rambu-clusters') ? 'rambu-clusters' : undefined
                        map.addLayer({
                            id: 'prov-highlight-outline',
                            type: 'line',
                            source: 'prov-geom',
                            paint: {
                                'line-color': HIGHLIGHT_COLOR,
                                'line-width': 2,
                            },
                        },
                            beforeId)
                    }

                    const ensureOrder = () => {
                        try {
                            // Pastikan fill & outline di bawah rambu
                            if (map.getLayer('prov-highlight-fill') && map.getLayer('rambu-clusters')) {
                                map.moveLayer('prov-highlight-fill', 'rambu-clusters')
                            }
                            if (map.getLayer('prov-highlight-outline') && map.getLayer('rambu-clusters')) {
                                map.moveLayer('prov-highlight-outline', 'rambu-clusters')
                            }
                        } catch { }
                    }
                    ensureOrder()

                    // view awal Indonesia
                    map.fitBounds(IDN_BOUNDS, { padding: 40, duration: 600, maxZoom: 7.5 })
                })

                const ro = new ResizeObserver(() => {
                    try {
                        map.resize()
                    } catch { }
                })
                ro.observe(containerRef.current!)

                return () => {
                    alive = false
                    ro.disconnect()
                    try {
                        map.remove()
                    } catch { }
                    mapRef.current = null
                }
            })()
    }, [])

    // Update data rambu di source
    useEffect(() => {
        const map = mapRef.current
        if (!map?.isStyleLoaded?.()) return
        const src = map.getSource('rambu') as any
        if (src?.setData) src.setData(rambuFC as any)

        console.debug('[FullMap] Rambu update. activeProvId=', activeProvId,
            'geom?', !!normalizedProvGeom,
            'count(all)=', rambuData?.length ?? 0,
            'count(filtered)=', rambuFiltered?.length ?? 0)
    }, [rambuFC, activeProvId, normalizedProvGeom, rambuData, rambuFiltered])

    // === ZOOM LOGIC: dipanggil tiap klik "Tampilkan" atau data siap
    // Urutan:
    // 1) Kalau ada geom provinsi → fit ke bbox geom (maxZoom dibatasi agar tidak terlalu dekat)
    // 2) else kalau ada titik rambu → fit ke bbox titik
    // 3) else reset ke Indonesia
    useEffect(() => {
        const map = mapRef.current
        if (!map?.isStyleLoaded?.()) return

        const provSrc = map.getSource('prov-geom') as any
        const setProvData = (geo: any) => {
            if (provSrc?.setData) provSrc.setData(geo)
        }

        // reset nasional bila tidak ada provinsi aktif
        if (!activeProvId) {
            setProvData({ type: 'FeatureCollection', features: [] })
            map.fitBounds(IDN_BOUNDS, { padding: 48, duration: 700, maxZoom: 7.5 })
            return
        }

        // 1) bbox dari geom provinsi
        const provGeom = normalizeGeoJSON(provGeomRaw)
        if (provGeom) {
            try {
                setProvData(provGeom)
                const bbox = turf.bbox(
                    provGeom.type === 'Feature' || provGeom.type === 'FeatureCollection'
                        ? provGeom
                        : toFeature(provGeom)
                ) as [number, number, number, number]
                map.fitBounds(
                    [
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[3]],
                    ],
                    { padding: 64, duration: 800, maxZoom: 8.5 }
                )
                return
            } catch {
                // lanjut ke fallback rambu
            }
        }

        // 2) fallback: bbox titik rambu
        //if (rambuFC?.features?.length > 0) {
        if (!provGeom && rambuFC?.features?.length > 0) {
            try {
                setProvData({ type: 'FeatureCollection', features: [] })
                const pb = turf.bbox(turf.featureCollection(rambuFC.features as any)) as [
                    number,
                    number,
                    number,
                    number
                ]
                map.fitBounds(
                    [
                        [pb[0], pb[1]],
                        [pb[2], pb[3]],
                    ],
                    { padding: 64, duration: 800, maxZoom: 8.5 }
                )
                return
            } catch {
                // lanjut ke reset
            }
        }

        // 3) ultimate fallback: nasional
        setProvData({ type: 'FeatureCollection', features: [] })
        map.fitBounds(IDN_BOUNDS, { padding: 48, duration: 700, maxZoom: 7.5 })
    }, [activeProvId, provGeomRaw, normalizedProvGeom, rambuFC, refreshSeq])

    const activeProvName = activeProvId
        ? provinces?.find((p) => p.id === activeProvId)?.name ?? `Provinsi #${activeProvId}`
        : 'Semua Provinsi'

    return (
        <div className="absolute inset-0">
            <div
                ref={containerRef}
                className="absolute inset-0 h-full w-full"
                style={{ minHeight: '100svh', background: '#eef2ff' }}
            />

            {/* BURGER (drawer kiri) */}
            {drawerOpen && (
                <button
                    type="button"
                    onClick={() => setDrawerOpen((v) => !v)}
                    className="absolute top-3 left-3 z-[1100] rounded-full bg-white border shadow p-2 hover:bg-gray-50"
                    aria-label="Buka/tutup menu"
                >
                    <Menu size={18} />
                </button>
            )}

            {/* FAB Filter */}
            <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                className="absolute top-30 right-3 z-[1100] rounded-full bg-white border shadow p-2 hover:bg-gray-50"
                aria-label="Filter peta"
                title="Filter peta"
            >
                {panelOpen ? <X size={18} /> : <Filter size={18} />}
            </button>

            {/* Panel filter */}
            {panelOpen && (
                <div className="absolute top-28 right-3 z-[1099] rounded-2xl bg-white/95 backdrop-blur border shadow p-3 w-[340px] max-h-[70vh] overflow-auto">
                    <div className="text-sm font-semibold mb-2">Filter Peta</div>

                    <label className="block">
                        <span className="block text-xs mb-1">Provinsi</span>
                        <select
                            value={pendingProvStr}
                            onChange={(e) => setPendingProvStr(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                        >
                            <option value="">— Semua provinsi —</option>
                            {provinces?.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={() => {
                            const newId = pendingProvStr ? Number(pendingProvStr) : undefined
                            setActiveProvId((prev) => {
                                // jika pilih prov yang sama → tetap set lagi supaya state konsisten
                                // lalu paksa refresh zoom dengan refreshSeq
                                if (prev === newId) {
                                    setRefreshSeq((s) => s + 1)
                                    return prev
                                }
                                return newId
                            })
                            //if (newId !== undefined) {
                            // juga paksa refresh zoom saat ganti prov agar responsif
                            //refetchRambu()
                            setRefreshSeq((s) => s + 1)
                            //}
                        }}
                        className="mt-3 w-full rounded-lg bg-[#004AAD] text-white text-sm py-2 hover:opacity-95 disabled:opacity-60"
                        disabled={loadingAny}
                    >
                        {loadingAny ? 'Memuat…' : 'Tampilkan'}
                    </button>

                    <div className="mt-3 text-[11px] text-gray-600">
                        Menampilkan: <span className="font-semibold">{activeProvName}</span>
                    </div>
                    {/* <div className="mt-2 text-[11px] text-gray-500">
                        {loadingRambu ? 'Titik rambu: memuat…' : `Titik rambu: ${rambu?.length ?? 0}`}
                    </div> */}
                    {/* <div className="mt-2 text-[11px] text-gray-500">
                        {loadingRambu
                            ? 'Titik rambu: memuat…'
                            : `Titik rambu: ${rambuFiltered?.length ?? 0}`}
                    </div> */}
                    <div className="mt-2 text-[11px] text-gray-500">
                        {loadingRambu
                            ? 'Titik rambu: memuat…'
                            : `Titik rambu: ${rambuFiltered?.length ?? 0} ${activeProvId ? '(dalam provinsi)' : '(nasional)'}`}
                        {(!loadingRambu && activeProvId && normalizedProvGeom && rambuFiltered?.length === 0) && (
                            <div className="mt-1 text-[10px] text-amber-600">
                                Tidak ada rambu di dalam batas provinsi ini.
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Loader detail (geom & rambu) */}
            {showDetailedLoader && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200]">
                    <div className="rounded-xl bg-white/95 backdrop-blur px-4 py-3 border shadow-md w-[300px]">
                        <div className="text-[13px] font-semibold mb-2 text-slate-700">
                            Memuat Data Peta
                        </div>
                        <ul className="space-y-1 text-[12px]">
                            <li className="flex items-center gap-2">
                                {loadingGeom ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                                ) : (
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                                )}
                                <span className="text-slate-600">
                                    Geometri provinsi:{" "}
                                    {loadingGeom ? "memuat…" : "selesai"}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                {loadingRambu ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                ) : (
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                                )}
                                {/* <span className="text-slate-600">
                                    Titik rambu:{" "}
                                    {loadingRambu ? "memuat…" : (rambu?.length ?? 0)}
                                </span> */}
                                <span className="text-slate-600">
                                    Titik rambu: {loadingRambu ? "memuat…" : (rambuFiltered?.length ?? 0)}
                                </span>
                            </li>
                        </ul>
                        <div className="mt-2 h-1 w-full rounded bg-slate-200 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#004AAD] to-[#2563eb] transition-all duration-300"
                                style={{
                                    width:
                                        loadingGeom && loadingRambu
                                            ? '35%'
                                            : loadingGeom || loadingRambu
                                                ? '70%'
                                                : '100%',
                                }}
                            />
                        </div>
                    </div>
                    {!loadingRambu && activeProvId && normalizedProvGeom && rambuFiltered?.length === 0 && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1050]">
                            <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg border shadow text-xs text-gray-600">
                                Tidak ada rambu dalam provinsi: <span className="font-semibold">{activeProvName}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Watermark */}
            <div className="absolute bottom-3 left-3 z-[1000] text-white text-xs bg-[#004AAD]/80 px-3 py-1 rounded-md shadow">
                © MSCode — BNPB Rambu Map
            </div>
        </div>
    )
}
