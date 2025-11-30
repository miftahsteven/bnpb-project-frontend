'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as turf from '@turf/turf'
import { Filter, X, Loader2, Menu } from 'lucide-react'
import { useRambu, toGeoJSON } from '@/hooks/useRambu'
import { useProvinceGeom } from '@/hooks/useProvinceGeom' // <- dipakai untuk bbox saja
import { useSimRambu } from "@/hooks/useSimRambu";
import { useCategories, useDisasterTypes, useModels, useCostSources } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'
import { is } from 'zod/locales'
import {
    useProvinces,
    useCities,
    useDistricts,
    useSubdistricts,
} from '@/hooks/useCascadingLocations'
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
    4: '#ff0a43',
}

// Warna status
const STATUS_COLORS = {
    simulation: '#ec4899', // pink-500
    draft: '#f59e0b',      // amber-500
    published: '#10b981',  // emerald-500
} as const

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'BSMSxOeDudgubp5q2uYq'

const HIGHLIGHT_COLOR = '#f97316' // oranye

type PointFeature = {
    type: 'Feature'
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: any
}


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
    const [pendingCityStr, setPendingCityStr] = useState<string>('')
    const [pendingDistrictStr, setPendingDistrictStr] = useState<string>('')
    const [pendingSubdistrictStr, setPendingSubdistrictStr] = useState<string>('')

    const [activeCityId, setActiveCityId] = useState<number | undefined>(undefined)
    const [activeDistrictId, setActiveDistrictId] = useState<number | undefined>(undefined)
    const [activeSubdistrictId, setActiveSubdistrictId] = useState<number | undefined>(undefined)

    // Filter tambahan: kategori, jenis bencana, model rambu
    const [pendingCategoryStr, setPendingCategoryStr] = useState<string>('')
    const [pendingDisasterStr, setPendingDisasterStr] = useState<string>('')
    const [pendingModelStr, setPendingModelStr] = useState<string>('')
    const [pendingYearStr, setPendingYearStr] = useState<string>('')


    const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined)
    const [activeDisasterId, setActiveDisasterId] = useState<number | undefined>(undefined)
    const [activeModelId, setActiveModelId] = useState<number | undefined>(undefined)

    // ================= Derivasi data cascading UNTUK FILTER (beda dari simulasi) =================
    const filterProvNum = pendingProvStr ? Number(pendingProvStr) : undefined
    const filterCityNum = pendingCityStr ? Number(pendingCityStr) : undefined
    const filterDistrictNum = pendingDistrictStr ? Number(pendingDistrictStr) : undefined

    const { data: filterCities } = useCities(filterProvNum)
    const { data: filterDists } = useDistricts(filterCityNum)
    const { data: filterSubs } = useSubdistricts(filterDistrictNum)

    const [activeProvId, setActiveProvId] = useState<number | undefined>(undefined)
    const [refreshSeq, setRefreshSeq] = useState(0) // <- paksa refresh zoom walau prov tidak berubah
    const { points: simPoints, addPoint: addSimPoint } = useSimRambu();
    const { token } = useAuth()
    const user = useAuth().user;
    const { data: models } = useModels()
    const { data: disasters } = useDisasterTypes()
    const { data: costSources } = useCostSources()
    const { data: categories } = useCategories()
    const simPopupRef = useRef<any>(null)
    const geoReqSeqRef = useRef(0)
    const simClickIdRef = useRef<string>('sim-click') // id source marker klik

    const [simPoint, setSimPoint] = useState<{ lat: number; lng: number } | null>(null)
    const [simGeo, setSimGeo] = useState<{
        province?: string
        city?: string
        district?: string
        village?: string
        provinceId?: number
        cityId?: number
        districtId?: number
        subdistrictId?: number
    } | null>(null)
    const [simOpen, setSimOpen] = useState(false)
    const [simLoading, setSimLoading] = useState(false)
    const [simErr, setSimErr] = useState<string | null>(null)
    const [simSaving, setSimSaving] = useState(false)

    const [simProvId, setSimProvId] = useState<string>('')
    const [simCityId, setSimCityId] = useState<string>('')
    const [simDistrictId, setSimDistrictId] = useState<string>('')
    const [simSubdistrictId, setSimSubdistrictId] = useState<string>('')

    const simProvNum = simProvId ? Number(simProvId) : undefined
    const simCityNum = simCityId ? Number(simCityId) : undefined
    const simDistrictNum = simDistrictId ? Number(simDistrictId) : undefined
    const activeYear = useMemo(() => {
        return pendingYearStr ? Number(pendingYearStr) : undefined
    }, [pendingYearStr])


    // Cascading referensi untuk form simulasi
    const { data: provs } = useProvinces()
    const { data: cities } = useCities(simProvNum)
    const { data: dists } = useDistricts(simCityNum)
    const { data: subs } = useSubdistricts(simDistrictNum)

    // Reset anak ketika parent berubah
    useEffect(() => { setSimCityId(''); setSimDistrictId(''); setSimSubdistrictId('') }, [simProvId])
    useEffect(() => { setSimDistrictId(''); setSimSubdistrictId('') }, [simCityId])
    useEffect(() => { setSimSubdistrictId('') }, [simDistrictId])
    useEffect(() => {
        setPendingCityStr('')
        setPendingDistrictStr('')
        setPendingSubdistrictStr('')
    }, [pendingProvStr])
    useEffect(() => {
        setPendingDistrictStr('')
        setPendingSubdistrictStr('')
    }, [pendingCityStr])
    useEffect(() => {
        setPendingSubdistrictStr('')
    }, [pendingDistrictStr])

    useEffect(() => {
        setActiveProvId(pendingProvStr ? Number(pendingProvStr) : undefined)
    }, [pendingProvStr])
    useEffect(() => {
        setActiveCityId(pendingCityStr ? Number(pendingCityStr) : undefined)
    }, [pendingCityStr])
    useEffect(() => {
        setActiveDistrictId(pendingDistrictStr ? Number(pendingDistrictStr) : undefined)
    }, [pendingDistrictStr])
    useEffect(() => {
        setActiveSubdistrictId(pendingSubdistrictStr ? Number(pendingSubdistrictStr) : undefined)
    }, [pendingSubdistrictStr])
    useEffect(() => {
        setActiveCategoryId(pendingCategoryStr ? Number(pendingCategoryStr) : undefined)
    }, [pendingCategoryStr])
    useEffect(() => {
        setActiveDisasterId(pendingDisasterStr ? Number(pendingDisasterStr) : undefined)
    }, [pendingDisasterStr])
    useEffect(() => {
        setActiveModelId(pendingModelStr ? Number(pendingModelStr) : undefined)
    }, [pendingModelStr])


    // Batas minimal zoom untuk boleh simulasi (maxZoom - 4)
    const getSimMinZoom = () => {
        const mz = mapRef.current?.getMaxZoom?.() ?? 22
        return Math.max(10, mz - 4)
    }
    const canSimulate = () => {
        const z = mapRef.current?.getZoom?.() ?? 0
        return z >= getSimMinZoom()
    }

    // data
    const { data: provinces } = useProvinces()

    const { data: rambuData, loading: loadingRambu, error: rambuErr } = useRambu(
        activeProvId,
        {
            // biarkan backend memfilter berdasar provinsi + kota jika dipilih
            forceAll: false,
            fetchAllWhenUndefined: true,
            cityId: activeCityId, // fokus: filter kota
            // siap jika nanti ingin tambahkan filter lain:
            districtId: activeDistrictId,
            subdistrictId: activeSubdistrictId,
            categoryId: activeCategoryId,
            disasterTypeId: activeDisasterId,
            modelId: activeModelId,
            year: activeYear,
        }
    )

    //disini untuk simulation componen form rambu floatin

    function renderSimPopupContent(point: { lat: number; lng: number }, geo: any, loading: boolean, err: string | null, canSim?: boolean) {
        const minZoomTxt = getSimMinZoom(); // fix: define minZoomTxt
        return `
          <div style="font-size:11px;min-width:200px">
            <div style="margin-bottom:4px;font-weight:600">Lokasi Terpilih</div>
            <div>Lat: ${point.lat.toFixed(6)}<br/>Lng: ${point.lng.toFixed(6)}</div>
            <hr style="margin:6px 0"/>
            <div style="font-weight:600">Geografis</div>
            ${err
                ? `<div style="color:#b00020">${err}</div>`
                : loading
                    ? '<div style="color:#004AAD">Memuat…</div>'
                    : geo
                        ? `<div>
                        Prov: ${geo.province || '-'}<br/>
                        Kota: ${geo.city || '-'}<br/>
                        Kec: ${geo.district || '-'}<br/>
                        Desa: ${geo.village || '-'}
                      </div>`
                        : '<div>Belum tersedia</div>'
            }
            
            <div style="margin-top:8px">
                          ${canSim && user
                ? `<a href="#" id="open-sim-form" style="color:#004AAD;text-decoration:underline;">tambah simulasi rambu disini</a>`
                : `
                     <div style="color:#64748b;margin-bottom:4px;">Perbesar peta untuk simulasi (min zoom ${minZoomTxt}).</div>
                     <a href="#" id="open-sim-form" style="color:#004AAD;text-decoration:underline;opacity:.8">tambah simulasi rambu disini</a>
                    `
            }
            </div>
          </div>
        `
    }

    function normName(s?: string) {
        return (s || '')
            .toLowerCase()
            .replace(/^kabupaten\s+/i, '')
            .replace(/^kota\s+/i, '')
            .trim()
    }

    function waitFor<T>(fn: () => T | null, timeoutMs = 4000, intervalMs = 150): Promise<T | null> {
        const start = Date.now()
        return new Promise(resolve => {
            const tick = () => {
                const v = fn()
                if (v) return resolve(v)
                if (Date.now() - start > timeoutMs) return resolve(null)
                setTimeout(tick, intervalMs)
            }
            tick()
        })
    }

    const applySimGeografis = useCallback(async (geo: { province?: string; city?: string; district?: string; village?: string }) => {
        // 1. Province
        const provFound = provs?.find(p => normName(p.name) === normName(geo.province))
        if (provFound) {
            setSimProvId(String(provFound.id))
        } else {
            // Tidak ditemukan, hentikan
            return
        }
        // 2. City (tunggu cities ter-load)
        const cityList = await waitFor(() => (cities && cities.length ? cities : null))
        const cityFound = cityList?.find((c: any) => normName(c.name) === normName(geo.city))
        if (cityFound) {
            setSimCityId(String(cityFound.id))
        } else {
            return
        }
        // 3. District
        const distList = await waitFor(() => (dists && dists.length ? dists : null))
        const distFound = distList?.find((d: any) => normName(d.name) === normName(geo.district))
        if (distFound) {
            setSimDistrictId(String(distFound.id))
        } else {
            return
        }
        // 4. Subdistrict
        const subList = await waitFor(() => (subs && subs.length ? subs : null))
        const subFound = subList?.find((s: any) => normName(s.name) === normName(geo.village))
        if (subFound) {
            setSimSubdistrictId(String(subFound.id))
        }
    }, [provs, cities, dists, subs])

    const detectSimGeografis = useCallback(async () => {
        if (!simPoint) return
        try {
            const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
            // Coba GET lalu fallback POST
            let res = await fetch(`${base}/api/ref/geografis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: simPoint.lat, long: simPoint.lng })
            })
            if (!res.ok) throw new Error(`Geografis gagal (${res.status})`)
            const j = await res.json()
            const g = j?.data
            if (!g) throw new Error('Data geografis kosong')
            const geoData = { province: g.province, city: g.city, district: g.district, village: g.village }
            await applySimGeografis(geoData)
        } catch (e) {
            console.warn('[FullMap] detectSimGeografis gagal:', e)
        }
    }, [simPoint, applySimGeografis])

    async function resolveGeoIds(geoData: { province?: string; city?: string; district?: string; village?: string }) {
        const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
        const out: { provinceId?: number; cityId?: number; districtId?: number; subdistrictId?: number } = {}
        try {
            // 1. Province
            if (geoData.province) {
                const provRes = await fetch(`${base}/api/ref/provinces`)
                if (provRes.ok) {
                    const provList = await provRes.json()
                    const provFound = provList?.data?.find((p: any) => normName(p.name) === normName(geoData.province))
                    if (provFound) out.provinceId = provFound.id
                }
            }
            // 2. City
            if (out.provinceId && geoData.city) {
                const cityRes = await fetch(`${base}/api/ref/cities?prov_id=${out.provinceId}`)
                if (cityRes.ok) {
                    const cityList = await cityRes.json()
                    const cityFound = cityList?.data?.find((c: any) => normName(c.name) === normName(geoData.city))
                    if (cityFound) out.cityId = cityFound.id
                }
            }
            // 3. District
            if (out.cityId && geoData.district) {
                const distRes = await fetch(`${base}/api/ref/districts?city_id=${out.cityId}`)
                if (distRes.ok) {
                    const distList = await distRes.json()
                    const distFound = distList?.data?.find((d: any) => normName(d.name) === normName(geoData.district))
                    if (distFound) out.districtId = distFound.id
                }
            }
            // 4. Subdistrict / Village
            if (out.districtId && geoData.village) {
                const subRes = await fetch(`${base}/api/ref/subdistricts?district_id=${out.districtId}`)
                if (subRes.ok) {
                    const subList = await subRes.json()
                    const subFound = subList?.data?.find((s: any) => normName(s.name) === normName(geoData.village))
                    if (subFound) out.subdistrictId = subFound.id
                }
            }
        } catch (e) {
            console.warn('[FullMap] resolveGeoIds gagal:', e)
        }
        return out
    }


    async function fetchGeografis(lat: number, lng: number) {
        setSimErr(null)
        setSimLoading(true)
        const seq = ++geoReqSeqRef.current
        const pointCtx = { lat, lng }
        const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
        const urlGet = `${base}/api/ref/geografis?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
        try {
            let res = await fetch(urlGet)
            if (!res.ok) {
                res = await fetch(`${base}/api/ref/geografis`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, long: lng })
                })
            }
            if (!res.ok) throw new Error(`Geografis gagal (${res.status})`)
            const j = await res.json()
            const g = j?.data
            if (!g) throw new Error('Data geografis kosong')
            const geoData = { province: g.province, city: g.city, district: g.district, village: g.village }
            // Dapatkan ID lokasi (jika tersedia di referensi)
            const idData = await resolveGeoIds(geoData)
            const fullGeo = { ...geoData, ...idData }
            setSimGeo(fullGeo)
            if (geoReqSeqRef.current === seq && simPopupRef.current) {
                simPopupRef.current.setHTML(
                    renderSimPopupContent(pointCtx, fullGeo, false, null, canSimulate())
                )
                attachSimLinkListener()
            }
        } catch (e: any) {
            const errMsg = e.message || 'Gagal deteksi geografis'
            setSimErr(errMsg)
            if (geoReqSeqRef.current === seq && simPopupRef.current) {
                simPopupRef.current.setHTML(
                    renderSimPopupContent(pointCtx, null, false, errMsg, canSimulate())
                )
                attachSimLinkListener()
            }
        } finally {
            setSimLoading(false)
        }
    }

    function attachSimLinkListener() {
        const link = document.getElementById('open-sim-form')
        if (link) {
            link.onclick = (ev: any) => {
                ev.preventDefault()
                ev.stopPropagation?.()
                ev.stopImmediatePropagation?.()
                // Cek minimal zoom sebelum membuka form simulasi
                const maps = mapRef.current
                if (!canSimulate()) {
                    const targetZoom = getSimMinZoom()
                    // Zoom mendekat ke titik klik
                    if (maps && simPoint) {
                        maps.easeTo({ center: [simPoint.lng, simPoint.lat], zoom: targetZoom, duration: 700 })
                        // Perbarui isi popup untuk memberi tahu user
                        if (simPopupRef.current) {
                            simPopupRef.current.setHTML(
                                renderSimPopupContent(simPoint, simGeo, false, null, false)
                            )
                            attachSimLinkListener()
                        }
                    }
                    return
                }
                // Boleh simulasi → buka form dan tutup popup
                // Cek minimal zoom sebelum membuka form simulasi
                const map = mapRef.current
                if (!canSimulate()) {
                    const targetZoom = getSimMinZoom()
                    // Zoom mendekat ke titik klik
                    if (map && simPoint) {
                        map.easeTo({ center: [simPoint.lng, simPoint.lat], zoom: targetZoom, duration: 700 })
                        // Perbarui isi popup untuk memberi tahu user
                        if (simPopupRef.current) {
                            simPopupRef.current.setHTML(
                                renderSimPopupContent(simPoint, simGeo, false, null, false)
                            )
                            attachSimLinkListener()
                        }
                    }
                    return
                }
                // Boleh simulasi → buka form dan tutup popup
                setSimOpen(true)
                if (simPopupRef.current) {
                    simPopupRef.current.remove()
                    simPopupRef.current = null
                }
            }
        }
    }


    async function saveSimulation(form: HTMLFormElement) {
        if (!simPoint) return
        setSimSaving(true); setSimErr(null)
        try {
            const fd = new FormData()
            fd.append('lat', String(simPoint.lat))
            fd.append('lng', String(simPoint.lng))
            const categoryId = (form.elements.namedItem('sim_category') as HTMLSelectElement)?.value
            const disasterTypeId = (form.elements.namedItem('sim_disaster') as HTMLSelectElement)?.value
            const model_id = (form.elements.namedItem('sim_model') as HTMLSelectElement)?.value
            const cost_id = (form.elements.namedItem('sim_cost') as HTMLSelectElement)?.value
            const year = (form.elements.namedItem('sim_year') as HTMLSelectElement)?.value
            const photoInput = form.elements.namedItem('sim_photo') as HTMLInputElement
            const photoFile = photoInput?.files?.[0]
            const description = (form.elements.namedItem('sim_description') as HTMLTextAreaElement)?.value

            if (categoryId) fd.append('categoryId', categoryId)
            if (disasterTypeId) fd.append('disasterTypeId', disasterTypeId)
            if (model_id) fd.append('model_id', model_id)
            if (cost_id) fd.append('cost_id', cost_id)
            if (year) fd.append('year', year)
            if (description) fd.append('description', description)

            // 4 lokasi dari select (utama), fallback ke deteksi jika belum ada
            if (simProvId) fd.append('prov_id', simProvId); else if (simGeo?.provinceId) fd.append('prov_id', String(simGeo.provinceId))
            if (simCityId) fd.append('city_id', simCityId); else if (simGeo?.cityId) fd.append('city_id', String(simGeo.cityId))
            if (simDistrictId) fd.append('district_id', simDistrictId); else if (simGeo?.districtId) fd.append('district_id', String(simGeo.districtId))
            if (simSubdistrictId) fd.append('subdistrict_id', simSubdistrictId); else if (simGeo?.subdistrictId) fd.append('subdistrict_id', String(simGeo.subdistrictId))

            if (photoFile) fd.append('photo_gps', photoFile)
            fd.append('isSimulation', '1')

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')}/api/rambu`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            })
            if (!res.ok) {
                const txt = await res.text().catch(() => '')
                throw new Error(txt || `Gagal (${res.status})`)
            }
            setSimOpen(false)
            setSimPoint(null)
            // reset lokasi form
            setSimProvId(''); setSimCityId(''); setSimDistrictId(''); setSimSubdistrictId('')
        } catch (e: any) {
            setSimErr(e.message || 'Gagal simpan')
        } finally {
            setSimSaving(false)
        }
    }

    // ESC untuk bersihkan marker & popup simulasi
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            const map = mapRef.current
            // kosongkan marker klik
            const clickSrc = map?.getSource?.('sim-click') as any
            if (clickSrc?.setData) {
                clickSrc.setData({ type: 'FeatureCollection', features: [] })
            }
            // tutup popup & form
            if (simPopupRef.current) {
                try { simPopupRef.current.remove() } catch { }
                simPopupRef.current = null
            }
            setSimOpen(false)
            setSimPoint(null)
            setSimGeo(null)
            setSimErr(null)
            setSimLoading(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])


    //disini akhir dari form simulation rambu

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
        // Tidak ada data → kosong
        if (!rambuData) return []

        // Base awal: semua rambu, lalu terapkan filter satu per satu
        let base = [...rambuData]

        // =====================
        // FILTER WILAYAH (opsional, bisa default “Semua”)
        // =====================
        if (activeProvId) {
            base = base.filter((r: any) => Number(r.provinceId ?? r.prov_id) === Number(activeProvId))
        }
        if (activeCityId) {
            base = base.filter((r: any) => Number(r.cityId ?? r.city_id) === Number(activeCityId))
        }
        if (activeDistrictId) {
            base = base.filter((r: any) => Number(r.districtId ?? r.district_id) === Number(activeDistrictId))
        }
        if (activeSubdistrictId) {
            base = base.filter((r: any) => Number(r.subdistrictId ?? r.subdistrict_id) === Number(activeSubdistrictId))
        }

        // =====================
        // FILTER NON-WILAYAH (boleh dipilih meski wilayah “Semua”)
        // =====================
        if (activeCategoryId) {
            base = base.filter((r: any) => Number(r.categoryId ?? r.category_id) === Number(activeCategoryId))
        }
        if (activeDisasterId) {
            base = base.filter((r: any) => Number(r.disasterTypeId ?? r.disaster_type_id) === Number(activeDisasterId))
        }
        if (activeModelId) {
            base = base.filter((r: any) => {
                const mid = Number(r.model_id ?? r.modelId)
                return Number.isFinite(mid) && mid === Number(activeModelId)
            })
        }
        if (typeof activeYear === 'number') {
            base = base.filter((r: any) => {
                const yr = Number(r.year ?? r.tahun)
                return Number.isFinite(yr) && yr === Number(activeYear)
            })
        }

        // =====================
        // SPATIAL LIMIT (hanya bila ada provinsi aktif + geom)
        // =====================
        if (!activeProvId) {
            // Tanpa provinsi → tidak perlu spatial, kembalikan hasil meta/non-wilayah
            return base
        }

        const polyFC = toPolygonFeatureCollection(normalizedProvGeom)
        if (!polyFC) return base

        try {
            const KM_BUFFER = 2
            const DEG_BUFFER = KM_BUFFER / 111
            const bufferedFC = {
                type: 'FeatureCollection',
                features: (polyFC.features || []).map((f: any) => {
                    try { return turf.buffer(f, DEG_BUFFER, { units: 'degrees' }) } catch { return f }
                })
            } as any

            const pointFeatures = base.map((r: any) => {
                const lng = Number(r.lng ?? r.lon)
                const lat = Number(r.lat)
                if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
                return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: r }
            }).filter(Boolean)

            if (!pointFeatures.length) return base

            const pointsFC = { type: 'FeatureCollection', features: pointFeatures } as any

            let within: any[] = []
            try {
                const tmp = turf.pointsWithinPolygon(pointsFC, bufferedFC)
                within = tmp.features.map((f: any) => f.properties)
            } catch { /* ignore */ }

            if (!within.length) {
                const manual: any[] = []
                for (const pf of pointFeatures as PointFeature[]) {
                    const c = pf.geometry.coordinates
                    for (const poly of (bufferedFC.features || [])) {
                        try {
                            if (turf.booleanPointInPolygon(c, poly.geometry)) {
                                manual.push(pf.properties)
                                break
                            }
                        } catch { /* ignore */ }
                    }
                }
                if (manual.length) within = manual
            }

            return within.length ? within : base
        } catch {
            return base
        }
    }, [
        rambuData,
        activeProvId,
        activeCityId,
        activeDistrictId,
        activeSubdistrictId,
        activeCategoryId,
        activeDisasterId,
        activeModelId,
        activeYear,
        normalizedProvGeom
    ])

    useEffect(() => {
        if (!activeProvId || !rambuData) return
        const sample = rambuData
            .filter((r: any) => r.provinceId === activeProvId)
            .slice(0, 5)
            .map((r: any) => ({ id: r.id, lat: r.lat, lng: r.lng }))
        console.debug('[FullMap][ProvDebug]', { activeProvId, sampleCount: sample.length, sample })
    }, [activeProvId, rambuData])

    const rambuFC = useMemo(() => toGeoJSON(rambuFiltered), [rambuFiltered])
    // geom dipakai HANYA untuk zoom (tidak digambar)    
    //const { data: provGeomRaw, loading: loadingGeom } = useProvinceGeom(activeProvId, { enabled: !!activeProvId })
    const loadingAny = loadingRambu || (activeProvId ? loadingGeom : false)
    //const loadingAny = loadingRambu || loadingGeom
    const showDetailedLoader = loadingAny && refreshSeq === 0

    // INIT MAP (tanpa layer geom)
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!containerRef.current) return;
            const maplibregl = (await import("maplibre-gl")).default;

            if (typeof window !== "undefined") {
                // alias global untuk plugin / script yang mengharapkan `maplibre`
                (window as any).maplibre = maplibregl;
                (window as any).maplibregl = maplibregl; // sekalian pastikan global ini juga ada
            }

            //const styleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
            const styleUrl = `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`;
            const fallbackStyle = "https://demotiles.maplibre.org/style.json";

            // const map = new maplibregl.Map({
            //     container: containerRef.current!,
            //     style: styleUrl,
            //     center: [117.5, -2.5],
            //     zoom: 4,
            //     //antialias: true, // OK in Map options
            // });
            const map = new maplibregl.Map({
                container: containerRef.current!,
                style: styleUrl,
                center: [117.5, -2.5],
                zoom: 4,
                //antialias: true,     // opsi untuk render lebih halus
                pitchWithRotate: false,
                attributionControl: false,  // kita bisa custom control
            });
            if (!mapRef.current) {
                mapRef.current = new maplibregl.Map({
                    container: containerRef.current,
                    style: styleUrl,
                    center: [117.5, -2.5],
                    zoom: 4
                })
            }

            mapRef.current = map;

            //map.doubleClickZoom.disable();

            map.on("error", (e: any) => {
                const msg = String(e?.error || "");
                if (msg.includes("style") || msg.includes("Failed") || msg.includes("Network")) {
                    try { (map as any).setStyle(fallbackStyle); } catch { }
                }
            });

            map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

            map.on("load", () => {
                if (!alive) return;

                // Source & layer marker klik (tanda kontak biru tua)
                if (!map.getSource('sim-click')) {
                    map.addSource('sim-click', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    })
                }
                if (!map.getLayer('sim-click-marker')) {
                    map.addLayer({
                        id: 'sim-click-marker',
                        type: 'circle',
                        source: 'sim-click',
                        paint: {
                            'circle-color': BRAND_BLUE,
                            'circle-radius': 9,
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff'
                        }
                    })
                }

                // ===============================
                // Source & layers: RAMBU (cluster)
                // ===============================
                if (!map.getSource("rambu")) {
                    map.addSource("rambu", {
                        type: "geojson",
                        data: rambuFC as any,
                        cluster: true,
                        clusterMaxZoom: 11, //11,14
                        clusterRadius: 40, //40, 20 
                        // Agregasi status dalam cluster
                        clusterProperties: {
                            simCount: [
                                '+',
                                //['case', ['==', ['get', 'isSimulation'], 1], 1, 0],
                                ['case', ['==', ['to-number', ['coalesce', ['get', 'isSimulation'], 0]], 1], 1, 0],
                            ],
                            publishedCount: [
                                '+',
                                ['case', ['==', ['get', 'status'], 'published'], 1, 0],
                            ],
                            draftCount: [
                                '+',
                                ['case', ['==', ['get', 'status'], 'draft'], 1, 0],
                            ],
                        },
                    });
                }

                if (!map.getLayer("rambu-clusters")) {
                    map.addLayer({
                        id: "rambu-clusters",
                        type: "circle",
                        source: "rambu",
                        filter: ["has", "point_count"],
                        paint: {
                            // "circle-color": [
                            //     "step",
                            //     ["get", "point_count"],
                            //     "#f59e0b",  //diganti
                            //     20, "#42a5f5",
                            //     50, "#1e88e5",
                            //     100, BRAND_BLUE
                            // ],
                            // "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 50, 24, 100, 32],
                            // Warna cluster = status dominan dalam cluster
                            "circle-color": [
                                "case",
                                // sim dominan
                                ["all",
                                    [">=", ["coalesce", ["get", "simCount"], 0], ["coalesce", ["get", "publishedCount"], 0]],
                                    [">=", ["coalesce", ["get", "simCount"], 0], ["coalesce", ["get", "draftCount"], 0]]
                                ],
                                STATUS_COLORS.simulation,
                                // published dominan
                                [">=", ["coalesce", ["get", "publishedCount"], 0], ["coalesce", ["get", "draftCount"], 0]],
                                STATUS_COLORS.published,
                                // else → draft
                                STATUS_COLORS.draft
                            ],
                            // Radius tetap berdasarkan jumlah titik
                            "circle-radius": ["step", ["get", "point_count"], 14, 20, 18, 50, 24, 100, 32],
                            "circle-stroke-width": 1,
                            "circle-stroke-color": "#fff",
                        },
                    });
                }

                if (!map.getLayer("rambu-cluster-count")) {
                    map.addLayer({
                        id: "rambu-cluster-count",
                        type: "symbol",
                        source: "rambu",
                        filter: ["has", "point_count"],
                        layout: {
                            "text-field": ["get", "point_count_abbreviated"],
                            "text-size": 12,
                        },
                        paint: { "text-color": "#001b44" },
                    });
                }

                if (!map.getLayer("rambu-unclustered")) {
                    map.addLayer({
                        id: "rambu-unclustered",
                        // type: "circle",
                        type: "circle",
                        source: "rambu",
                        filter: ["!", ["has", "point_count"]],
                        paint: {
                            // "circle-color": [
                            //     "coalesce",
                            //     [
                            //         "case",
                            //         ["==", ["typeof", ["get", "disasterTypeId"]], "number"],
                            //         [
                            //             "match",
                            //             ["get", "disasterTypeId"],
                            //             1, COLOR_BY_DISASTER[1],
                            //             2, COLOR_BY_DISASTER[2],
                            //             3, COLOR_BY_DISASTER[3],
                            //             4, COLOR_BY_DISASTER[4],
                            //             DEFAULT_COLOR
                            //         ],
                            //         DEFAULT_COLOR
                            //     ],
                            //     DEFAULT_COLOR
                            // ],
                            // Warna titik tunggal berdasarkan status
                            "circle-color": [
                                "case",
                                //["==", ["get", "isSimulation"], 1], STATUS_COLORS.simulation,
                                ["==", ["to-number", ["coalesce", ["get", "isSimulation"], 0]], 1], STATUS_COLORS.simulation,
                                ["==", ["get", "status"], "published"], STATUS_COLORS.published,
                                ["==", ["get", "status"], "draft"], STATUS_COLORS.draft,
                                DEFAULT_COLOR
                            ],
                            "circle-radius": 7,
                            "circle-stroke-width": 1.5,
                            "circle-stroke-color": "#fff",
                        },
                    });
                }

                // Popups & cluster zoom
                map.on("click", "rambu-unclustered", (e: any) => {
                    const f = e.features?.[0]; if (!f) return;
                    const p = f.properties as any;
                    const coord = (f.geometry as any).coordinates as [number, number];
                    new maplibregl.Popup({ offset: 12 })
                        .setLngLat(coord)
                        .setHTML(`
                  <div style="min-width:220px">
                    <div style="font-weight:600;margin-bottom:4px">${p.name ?? "Rambu"}</div>
                    ${p.description ? `<div style="font-size:12px;color:#555">${p.description}</div>` : ""}
                    ${p.image ? `<div style="margin-top:8px"><img src="${p.image}" alt="foto" style="width:100%;height:auto;border-radius:6px;"/></div>` : ""}
                  </div>
                `)
                        .addTo(map);
                });

                map.on("click", "rambu-clusters", (e: any) => {
                    const feats = map.queryRenderedFeatures(e.point, { layers: ["rambu-clusters"] });
                    const f0 = feats[0] as any;
                    const clusterId = f0?.properties?.cluster_id;
                    const src = map.getSource("rambu") as any;
                    if (!clusterId || !src?.getClusterExpansionZoom) return;
                    src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                        if (err) return;
                        const ctr = (f0.geometry as any).coordinates as [number, number];
                        map.easeTo({ center: ctr, zoom });
                    });
                });

                // ===============================
                // OPTIONAL: prov-geom for highlight (kept empty by default)
                // ===============================
                if (!map.getSource("prov-geom")) {
                    map.addSource("prov-geom", { type: "geojson", data: { type: "FeatureCollection", features: [] } as any });
                }
                if (!map.getLayer("prov-highlight-fill")) {
                    map.addLayer({
                        id: "prov-highlight-fill",
                        type: "fill",
                        source: "prov-geom",
                        paint: { "fill-color": "#004AAD", "fill-opacity": 0.18 },
                    });
                }
                if (!map.getLayer("prov-highlight-outline")) {
                    map.addLayer({
                        id: "prov-highlight-outline",
                        type: "line",
                        source: "prov-geom",
                        paint: { "line-color": "#004AAD", "line-width": 2 },
                    });
                }

                map.on("click", (e: any) => {

                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['rambu-unclustered', 'rambu-clusters']
                    })
                    if (features && features.length) return
                    const { lng, lat } = e.lngLat;
                    console.log("Tambah titik simulasi:", lng, lat);
                    //addSimPoint(lng, lat);
                    setSimPoint({ lat, lng })
                    setSimOpen(false)
                    setSimGeo(null)
                    setSimErr(null)
                    setSimLoading(true)

                    // Update marker klik (sim-click)
                    const clickSrc = map.getSource('sim-click') as any
                    if (clickSrc?.setData) {
                        clickSrc.setData({
                            type: 'FeatureCollection',
                            features: [{
                                type: 'Feature',
                                geometry: { type: 'Point', coordinates: [lng, lat] },
                                properties: {}
                            }]
                        })
                    }

                    if (simPopupRef.current) {
                        simPopupRef.current.remove()
                        simPopupRef.current = null
                    }
                    const popup = new maplibregl.Popup({ closeOnClick: true })
                        .setLngLat([lng, lat])
                        //
                        .setHTML(
                            renderSimPopupContent({ lat, lng }, null, true, null, canSimulate())
                        )
                        .addTo(map)
                    simPopupRef.current = popup

                    // Attach link listener (awal – masih loading)
                    attachSimLinkListener()

                    // Mulai fetch geografis
                    fetchGeografis(lat, lng)
                });


                // SOURCE simulasi
                if (!map.getSource("sim-rambu")) {
                    map.addSource("sim-rambu", {
                        type: "geojson",
                        data: {
                            type: "FeatureCollection",
                            features: []
                        }
                    });
                }

                // LAYER titik simulasi
                if (!map.getLayer("sim-rambu-points")) {
                    map.addLayer({
                        id: "sim-rambu-points",
                        type: "circle",
                        source: "sim-rambu",
                        paint: {
                            "circle-color": "#10b981",
                            "circle-radius": 8,
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#ffffff"
                        }
                    });
                }


                // Initial view
                map.fitBounds(IDN_BOUNDS as any, { padding: 40, duration: 600, maxZoom: 7.5 });
            });

            const ro = new ResizeObserver(() => {
                try { map.resize(); } catch { }
            });
            ro.observe(containerRef.current!);

            return () => {
                alive = false;
                ro.disconnect();
                try { map.remove(); } catch { }
                mapRef.current = null;
            };
        })();
    }, [token]);

    const yearOptions = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 4 + i),
        [])


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

    useEffect(() => {
        const map = mapRef.current;
        if (!map?.isStyleLoaded?.()) return;

        const src = map.getSource("sim-rambu") as any;
        if (!src) return;

        src.setData({
            type: "FeatureCollection",
            features: simPoints.map((p) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [p.lng, p.lat],
                },
                properties: {
                    id: p.id,
                    createdAt: p.createdAt,
                },
            })),
        });
    }, [simPoints]);


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

            {/* component form */}
            {simOpen && simPoint && (
                <div className="absolute top-4 left-100 z-50 w-[300px] rounded-lg bg-white shadow-lg border p-3 text-xs">
                    <div className="flex justify-between items-center mb-2">
                        <strong className="text-[13px]">Simulasi Pembuatan Rambu Baru</strong>
                        <button
                            onClick={() => { setSimOpen(false); setSimPoint(null) }}
                            className="text-red-500 hover:text-red-700 text-xs"
                        >✕</button>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); saveSimulation(e.currentTarget) }}
                        className="space-y-2"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block mb-1">Lat</label>
                                <input
                                    readOnly
                                    value={simPoint.lat.toFixed(6)}
                                    className="w-full rounded border px-2 py-1 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Lng</label>
                                <input
                                    readOnly
                                    value={simPoint.lng.toFixed(6)}
                                    className="w-full rounded border px-2 py-1 bg-gray-50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Wilayah</span>
                                <button
                                    type="button"
                                    onClick={detectSimGeografis}
                                    className="rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50"
                                    disabled={!simPoint}
                                >
                                    Deteksi Lokasi
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block mb-1">Provinsi</label>
                                    <select
                                        value={simProvId}
                                        onChange={e => setSimProvId(e.target.value)}
                                        className="w-full rounded border px-2 py-1"
                                    >
                                        <option value="">— pilih —</option>
                                        {provs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1">Kota/Kabupaten</label>
                                    <select
                                        value={simCityId}
                                        onChange={e => setSimCityId(e.target.value)}
                                        disabled={!simProvId}
                                        className="w-full rounded border px-2 py-1 disabled:bg-gray-100"
                                    >
                                        <option value="">— pilih —</option>
                                        {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1">Kecamatan</label>
                                    <select
                                        value={simDistrictId}
                                        onChange={e => setSimDistrictId(e.target.value)}
                                        disabled={!simCityId}
                                        className="w-full rounded border px-2 py-1 disabled:bg-gray-100"
                                    >
                                        <option value="">— pilih —</option>
                                        {dists?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1">Kelurahan/Desa</label>
                                    <select
                                        value={simSubdistrictId}
                                        onChange={e => setSimSubdistrictId(e.target.value)}
                                        disabled={!simDistrictId}
                                        className="w-full rounded border px-2 py-1 disabled:bg-gray-100"
                                    >
                                        <option value="">— pilih —</option>
                                        {subs?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block mb-1">Rambu (Kategori)</label>
                                <select name="sim_category" className="w-full rounded border px-2 py-1">
                                    <option value="">— pilih —</option>
                                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {/* tambahkan description atau alamat di bagian sini, setelah rambu */}
                            <div>
                                <label className="block mb-1">Deskripsi / Alamat</label>
                                <input
                                    name="sim_description"
                                    className="w-full rounded border px-2 py-1"
                                    placeholder="(opsional) deskripsi singkat atau alamat lokasi rambu"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Model Rambu</label>
                                <select name="sim_model" className="w-full rounded border px-2 py-1">
                                    <option value="">— pilih —</option>
                                    {models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1">Jenis Bencana</label>
                                <select name="sim_disaster" className="w-full rounded border px-2 py-1">
                                    <option value="">— pilih —</option>
                                    {disasters?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1">Sumber Dana</label>
                                <select name="sim_cost" className="w-full rounded border px-2 py-1">
                                    <option value="">— pilih —</option>
                                    {costSources?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1">Tahun</label>
                                <select name="sim_year" className="w-full rounded border px-2 py-1">
                                    <option value="">— pilih —</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1">Foto (1 wajib)</label>
                            <input
                                name="sim_photo"
                                type="file"
                                accept="image/*"
                                className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:border file:rounded file:bg-[#004AAD] file:text-white"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Unggah 1 foto sebagai bukti lokasi.</p>
                        </div>
                        <div className="pt-1 flex gap-2">
                            <button
                                type="submit"
                                disabled={simSaving}
                                className="flex-1 rounded bg-[#004AAD] text-white py-1 text-xs disabled:opacity-60"
                            >
                                {simSaving ? 'Menyimpan…' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSimOpen(false); setSimPoint(null) }}
                                className="rounded bg-gray-200 px-3 py-1 text-xs"
                            >Batal</button>
                        </div>
                        {simErr && <div className="text-red-600">{simErr}</div>}
                        <p className="text-[10px] text-gray-500">
                            (Simulasi: backend mungkin menolak bila foto wajib. Tambahkan relaksasi validasi untuk isSimulation.)
                        </p>
                    </form>
                </div>
            )}

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
                <div className="absolute top-28 right-3 z-[1099] rounded-2xl bg-white/95 backdrop-blur border shadow p-3 w-[360px] max-h-[72vh] overflow-auto">
                    <div className="text-sm font-semibold mb-2">Filter Peta</div>

                    {/* Cascading wilayah */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-xs mb-1">Provinsi</span>
                            <select
                                value={pendingProvStr}
                                onChange={(e) => setPendingProvStr(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                            >
                                <option value="">— Semua —</option>
                                {provinces?.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kota/Kab</span>
                            <select
                                value={pendingCityStr}
                                onChange={(e) => setPendingCityStr(e.target.value)}
                                disabled={!pendingProvStr}
                                className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-[#004AAD]"
                            >
                                <option value="">— Semua —</option>
                                {filterCities?.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kecamatan</span>
                            <select
                                value={pendingDistrictStr}
                                onChange={(e) => setPendingDistrictStr(e.target.value)}
                                disabled={!pendingCityStr}
                                className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-[#004AAD]"
                            >
                                <option value="">— Semua —</option>
                                {filterDists?.map((d: any) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kel/Desa</span>
                            <select
                                value={pendingSubdistrictStr}
                                onChange={(e) => setPendingSubdistrictStr(e.target.value)}
                                disabled={!pendingDistrictStr}
                                className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-[#004AAD]"
                            >
                                <option value="">— Semua —</option>
                                {filterSubs?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Non-wilayah filters */}
                    <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="block text-xs mb-1">Kategori Rambu</span>
                                <select
                                    value={pendingCategoryStr}
                                    onChange={(e) => setPendingCategoryStr(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                                >
                                    <option value="">— Semua —</option>
                                    {categories?.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-xs mb-1">Jenis Bencana</span>
                                <select
                                    value={pendingDisasterStr}
                                    onChange={(e) => setPendingDisasterStr(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                                >
                                    <option value="">— Semua —</option>
                                    {disasters?.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="block text-xs mb-1">Model Rambu</span>
                                <select
                                    value={pendingModelStr}
                                    onChange={(e) => setPendingModelStr(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                                >
                                    <option value="">— Semua —</option>
                                    {models?.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-xs mb-1">Tahun</span>
                                <select
                                    value={pendingYearStr}
                                    onChange={(e) => setPendingYearStr(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]"
                                >
                                    <option value="">— Semua —</option>
                                    {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveProvId(pendingProvStr ? Number(pendingProvStr) : undefined)
                            setActiveCityId(pendingCityStr ? Number(pendingCityStr) : undefined)
                            setActiveDistrictId(pendingDistrictStr ? Number(pendingDistrictStr) : undefined)
                            setActiveSubdistrictId(pendingSubdistrictStr ? Number(pendingSubdistrictStr) : undefined)
                            setActiveCategoryId(pendingCategoryStr ? Number(pendingCategoryStr) : undefined)
                            setActiveDisasterId(pendingDisasterStr ? Number(pendingDisasterStr) : undefined)
                            setActiveModelId(pendingModelStr ? Number(pendingModelStr) : undefined)
                            setRefreshSeq(s => s + 1)
                        }}
                        className="mt-4 w-full rounded-lg bg-[#004AAD] text-white text-sm py-2 hover:opacity-95 disabled:opacity-60"
                        disabled={loadingRambu}
                    >
                        Terapkan Filter
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPendingProvStr('')
                            setPendingCityStr('')
                            setPendingDistrictStr('')
                            setPendingSubdistrictStr('')
                            setPendingCategoryStr('')
                            setPendingDisasterStr('')
                            setPendingModelStr('')
                            setActiveProvId(undefined)
                            setActiveCityId(undefined)
                            setActiveDistrictId(undefined)
                            setActiveSubdistrictId(undefined)
                            setActiveCategoryId(undefined)
                            setActiveDisasterId(undefined)
                            setActiveModelId(undefined)
                            setRefreshSeq(s => s + 1)
                        }}
                        className="mt-2 w-full rounded-lg bg-gray-200 text-gray-700 text-sm py-2 hover:bg-gray-300"
                    >
                        Reset
                    </button>

                    <div className="mt-3 text-[11px] text-gray-600">
                        Aktif: {activeProvId ? `Prov#${activeProvId}` : 'Semua Provinsi'}
                        {activeCityId ? ` / Kota#${activeCityId}` : ''}
                        {activeDistrictId ? ` / Kec#${activeDistrictId}` : ''}
                        {activeSubdistrictId ? ` / Kel#${activeSubdistrictId}` : ''}
                        {activeCategoryId ? ` / Kat#${activeCategoryId}` : ''}
                        {activeDisasterId ? ` / Bencana#${activeDisasterId}` : ''}
                        {activeModelId ? ` / Model#${activeModelId}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                        {loadingRambu
                            ? 'Titik rambu: memuat…'
                            : `Titik rambu: ${rambuFiltered.length} ${activeProvId ? '(terfilter)' : '(nasional)'}`}
                        {(!loadingRambu && rambuFiltered.length === 0) && (
                            <div className="mt-1 text-[10px] text-amber-600">Tidak ada rambu sesuai filter.</div>
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
