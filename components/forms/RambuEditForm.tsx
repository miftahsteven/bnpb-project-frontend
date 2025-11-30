import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
    useProvinces,
    useCities,
    useDistricts,
    useSubdistricts,
} from '@/hooks/useCascadingLocations'
import { useCategories, useDisasterTypes, useModels, useCostSources } from '@/hooks/useOptions'
import { useQueryClient } from '@tanstack/react-query'


type Photo = {
    id: number
    url: string
    type: number // 1 = GPS (asumsi), lainnya = tambahan
}
type RambuPropsLite = {
    year?: string | number | null
    cost_id?: number | null
    model?: number | null
    isSimulation?: number | null
}
type RambuItem = {
    id: number
    name?: string | null
    lat?: number | null
    lng?: number | null
    categoryId?: number | null
    category_id?: number | null
    disasterTypeId?: number | null
    disaster_type_id?: number | null
    prov_id?: number | null
    provinceId?: number | null
    city_id?: number | null
    cityId?: number | null
    district_id?: number | null
    districtId?: number | null
    subdistrict_id?: number | null
    subdistrictId?: number | null
    description?: string | null
    address?: string | null
    alamat?: string | null
    //RambuProps?: RambuPropsLite | null
    RambuProps?: RambuPropsLite | RambuPropsLite[] | null
    photos?: Photo[]
}

type Props = {
    open: boolean
    rambu: RambuItem | null
    onClose: () => void
    onUpdated?: (updated: any) => void
    token?: string
}

export default function RambuEditForm({ open, rambu, onClose, onUpdated, token }: Props) {

    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [isPrefilling, setIsPrefilling] = useState(false)
    const [hydratingCity, setHydratingCity] = useState(false)
    const [hydratingDist, setHydratingDist] = useState(false)
    const [hydratingSub, setHydratingSub] = useState(false)


    // Prefill
    const [categoryId, setCategoryId] = useState<string>('')
    const [disasterTypeId, setDisasterTypeId] = useState<string>('')

    const [lat, setLat] = useState<string>('') // simpan string agar mudah edit
    const [lng, setLng] = useState<string>('')

    // Wilayah (cascading)
    const [provStr, setProvStr] = useState<string>('')
    const [cityStr, setCityStr] = useState<string>('')
    const [distStr, setDistStr] = useState<string>('')
    const [subStr, setSubStr] = useState<string>('')

    const provNum = provStr ? Number(provStr) : undefined
    const cityNum = cityStr ? Number(cityStr) : undefined
    const distNum = distStr ? Number(distStr) : undefined

    const { data: provs } = useProvinces()
    const { data: cities } = useCities(provNum)
    const { data: dists } = useDistricts(cityNum)
    const { data: subs } = useSubdistricts(distNum)

    // RambuProps
    const [year, setYear] = useState<string>('') // select
    const [costId, setCostId] = useState<string>('') // select
    const [modelId, setModelId] = useState<string>('') // select
    const [isSimulation, setIsSimulation] = useState<boolean>(false)

    // Deskripsi / Alamat
    const [description, setDescription] = useState<string>('')

    // Foto
    const [removePhotoIds, setRemovePhotoIds] = useState<number[]>([])
    const [gpsFile, setGpsFile] = useState<File | null>(null)
    const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [full, setFull] = useState<RambuItem | null>(null)

    // Referensi untuk select
    //const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
    //const [disasters, setDisasters] = useState<Array<{ id: number; name: string }>>([])
    const [costs, setCosts] = useState<Array<{ id: number; name: string }>>([])
    //const [models, setModels] = useState<Array<{ id: number; name: string }>>([])

    const [detectingPos, setDetectingPos] = useState(false)
    const [geoApplied, setGeoApplied] = useState(false)
    const [geoErr, setGeoErr] = useState<string | null>(null)

    const { data: categories, loading: loadingCat } = useCategories()
    const { data: disasters, loading: loadingDis } = useDisasterTypes()
    const { data: models, loading: loadingModel } = useModels()
    const { data: costSources, loading: loadingCostSource } = useCostSources()
    const queryClient = useQueryClient()


    // ================== Helper tunggu data lokasi (sama konsep dgn RambuForm) ==================
    function waitFor(fn: () => any, timeoutMs = 4000, intervalMs = 150): Promise<any> {
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

    // ================== applyGeografis: SAMAKAN DENGAN RambuForm ==================
    const applyGeografis = useCallback(async (geo: any) => {
        setGeoApplied(false)
        // 1. Province
        const provFound = provs?.find(p => p.name?.toLowerCase() === geo.province?.toLowerCase())
        if (provFound) {
            setProvStr(String(provFound.id))
        } else {
            setGeoErr('Provinsi tidak ditemukan di referensi lokal.')
            return
        }

        // Tunggu cities ter-load
        const cityList = await waitFor(() => (cities && cities.length ? cities : null))
        const cityFound = cityList?.find((c: any) => c.name?.toLowerCase() === geo.city?.toLowerCase())
        if (cityFound) {
            setCityStr(String(cityFound.id))
        } else {
            setGeoErr('Klik Untuk Mendapatkan Kota/Kab.')
            return
        }

        // Tunggu districts
        const distList = await waitFor(() => (dists && dists.length ? dists : null))
        const distFound = distList?.find((d: any) => d.name?.toLowerCase() === geo.district?.toLowerCase())
        if (distFound) {
            setDistStr(String(distFound.id))
        } else {
            setGeoErr('Klik untuk mendapatkan kecamatan.')
            return
        }

        // Tunggu subdistricts
        const subList = await waitFor(() => (subs && subs.length ? subs : null))
        const subFound = subList?.find((s: any) => s.name?.toLowerCase() === geo.village?.toLowerCase())
        if (subFound) {
            setSubStr(String(subFound.id))
        } else {
            // Village bisa tidak ada; tidak fatal
            setGeoErr('Kelurahan/Desa tidak ditemukan (opsional).')
        }
        setGeoApplied(true)
    }, [provs, cities, dists, subs])

    // ================== handleDetectLatLng: pakai /api/ref/geografis ==================
    async function handleDetectLatLng() {
        setGeoErr(null); setDetectingPos(true); setGeoApplied(false)

        const latNum = Number(lat)
        const lngNum = Number(lng)
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
            setGeoErr('Latitude/Longitude tidak valid.')
            setDetectingPos(false)
            return
        }

        try {
            const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
            const url = `${base}/api/ref/geografis`
            const body = { lat: latNum, long: lngNum }
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const t = await res.text().catch(() => '')
                throw new Error(`Gagal (${res.status}) ${t}`)
            }
            const json = await res.json()
            const geo = json?.data
            if (!geo) {
                setGeoErr('Data geografis kosong.')
                setDetectingPos(false)
                return
            }
            await applyGeografis(geo)
        } catch (e: any) {
            setGeoErr(e?.message || 'Deteksi geografis gagal, coba lagi.')
        } finally {
            setDetectingPos(false)
        }
    }



    // Year options (contoh: 2005..tahun sekarang)
    const yearOptions = useMemo(() => {
        const now = new Date().getFullYear()
        const from = 2005
        const arr: number[] = []
        for (let y = now; y >= from; y--) arr.push(y)
        return arr
    }, [])


    // Helper fetch meta refs (coba beberapa endpoint agar kompatibel)
    async function fetchFirst<T = any>(paths: string[]): Promise<T | null> {
        const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
        for (const p of paths) {
            try {
                const url = `${base}${p.startsWith('/') ? '' : '/'}${p}`
                const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                if (!res.ok) continue
                const data = await res.json()
                return data
            } catch {
                // try next
            }
        }
        return null
    }

    // Prefill saat rambu berubah / open
    useEffect(() => {
        const src = (full || rambu) as any
        if (!open || !rambu) return
        setIsPrefilling(true)
        setErr(null)
        setSaving(false)
        setCategoryId(
            src.categoryId != null
                ? String(src.categoryId)
                : (src.category_id != null ? String(src.category_id) : '')
        )
        setDisasterTypeId(
            src.disasterTypeId != null
                ? String(src.disasterTypeId)
                : (src.disaster_type_id != null ? String(src.disaster_type_id) : '')
        )
        setLat(src.lat != null ? String(src.lat) : '')
        setLng(src.lng != null ? String(src.lng) : '')
        setProvStr(src.prov_id != null ? String(src.prov_id) : (src.provinceId != null ? String(src.provinceId) : ''))
        setCityStr(src.city_id != null ? String(src.city_id) : (src.cityId != null ? String(src.cityId) : ''))
        setDistStr(src.district_id != null ? String(src.district_id) : (src.districtId != null ? String(src.districtId) : ''))
        setSubStr(src.subdistrict_id != null ? String(src.subdistrict_id) : (src.subdistrictId != null ? String(src.subdistrictId) : ''))
        // Support object or array
        const propsSrc = Array.isArray(src.RambuProps) ? src.RambuProps[0] : src.RambuProps
        // console.log('propsSrc:', propsSrc)
        setYear(propsSrc?.year != null ? String(propsSrc.year) : '')
        setCostId(propsSrc?.cost_id != null ? String(propsSrc.cost_id) : '')
        setModelId(propsSrc?.model != null ? String(propsSrc.model) : '')
        setIsSimulation(!!(propsSrc?.isSimulation && Number(propsSrc.isSimulation) === 1))


        setDescription(src.description ?? src.address ?? src.alamat ?? '')

        setRemovePhotoIds([])
        setGpsFile(null)
        setAdditionalFiles([])

        // beri sedikit waktu agar hooks wilayah sempat load, lalu matikan flag
        setTimeout(() => setIsPrefilling(false), 0)
    }, [
        open,
        rambu?.id,
        // Pastikan prefill rerun ketika RambuProps dari detail sudah datang
        full?.id,
        // re-run when array/object changes
        Array.isArray(full?.RambuProps) ? full?.RambuProps?.[0]?.year : full?.RambuProps?.year,
        Array.isArray(full?.RambuProps) ? full?.RambuProps?.[0]?.cost_id : full?.RambuProps?.cost_id,
        Array.isArray(full?.RambuProps) ? full?.RambuProps?.[0]?.model : full?.RambuProps?.model,
        Array.isArray(full?.RambuProps) ? full?.RambuProps?.[0]?.isSimulation : full?.RambuProps?.isSimulation,
    ])

    // Fetch detail rambu saat modal dibuka agar punya photos & RambuProps
    useEffect(() => {
        if (!open || !rambu?.id) return
        const id = rambu.id
        let abort = false
        async function run() {
            try {
                setLoadingDetail(true)
                setFull(null)
                const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
                const url = `${base}/api/rambu/${id}`
                const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                })
                if (!res.ok) throw new Error(`Gagal memuat detail (${res.status})`)
                const data = await res.json()
                if (!abort) setFull(data)
            } catch {
                if (!abort) setFull(null)
            } finally {
                if (!abort) setLoadingDetail(false)
            }
        }
        run()
        return () => { abort = true }
    }, [open, rambu?.id, token])

    useEffect(() => {
        if (!open) return
        const src = (full || rambu) as any
        if (!src?.city_id) return
        // pastikan provinsi sudah ter-set sesuai data
        if (!provStr || String(src.prov_id) !== String(provStr)) return
        // jika cityStr sudah benar, tidak perlu apa-apa
        if (String(cityStr) === String(src.city_id)) return
        // jika cities belum tersedia, tunggu
        if (!Array.isArray(cities) || cities.length === 0) return
        // cek id kota ada di daftar
        const found = cities.find((c: any) => String(c.id) === String(src.city_id))
        if (!found) return
        setHydratingCity(true)
        setCityStr(String(found.id))
        // selesai hydrate city
        setTimeout(() => setHydratingCity(false), 0)
    }, [open, provStr, cities, cityStr, rambu?.id, full?.id])

    useEffect(() => {
        if (!open) return
        const src = (full || rambu) as any
        if (!src?.district_id) return
        // pastikan city sudah ter-set sesuai data
        if (!cityStr || String(src.city_id) !== String(cityStr)) return
        // jika distStr sudah benar, tidak perlu apa-apa
        if (String(distStr) === String(src.district_id)) return
        // jika districts belum tersedia, tunggu
        if (!Array.isArray(dists) || dists.length === 0) return
        // cek id district ada di daftar
        const found = dists.find((d: any) => String(d.id) === String(src.district_id))
        if (!found) return
        setHydratingDist(true)
        setDistStr(String(found.id))
        // selesai hydrate dist
        setTimeout(() => setHydratingDist(false), 0)
    }, [open, cityStr, dists, distStr, rambu?.id, full?.id])

    useEffect(() => {
        if (!open) return
        const src = (full || rambu) as any
        if (!src?.subdistrict_id) return
        // pastikan district sudah ter-set sesuai data
        if (!distStr || String(src.district_id) !== String(distStr)) return
        // jika subStr sudah benar, tidak perlu apa-apa
        if (String(subStr) === String(src.subdistrict_id)) return
        // jika subdistricts belum tersedia, tunggu
        if (!Array.isArray(subs) || subs.length === 0) return
        // cek id subdistrict ada di daftar
        const found = subs.find((s: any) => String(s.id) === String(src.subdistrict_id))
        if (!found) return
        setHydratingSub(true)
        setSubStr(String(found.id))
        // selesai hydrate sub
        setTimeout(() => setHydratingSub(false), 0)
    }, [open, distStr, subs, subStr, rambu?.id, full?.id])

    // Reset child saat parent wilayah berubah
    useEffect(() => {
        if (isPrefilling || hydratingCity) return
        // user benar‑benar mengubah provinsi → reset turunannya
        setCityStr('')
        setDistStr('')
        setSubStr('')
    }, [provStr, isPrefilling, hydratingCity])

    useEffect(() => {
        if (isPrefilling || hydratingDist) return
        setDistStr('')
        setSubStr('')
    }, [cityStr, isPrefilling, hydratingDist])

    useEffect(() => {
        if (isPrefilling || hydratingSub) return
        setSubStr('')
    }, [distStr, isPrefilling, hydratingSub])

    // Reset child saat parent wilayah berubah (versi sederhana tanpa hydrating)

    useEffect(() => {
        if (isPrefilling) return
        setDistStr('')
        setSubStr('')
    }, [cityStr, isPrefilling])

    useEffect(() => {
        if (isPrefilling) return
        setSubStr('')
    }, [distStr, isPrefilling])

    if (!open || !rambu) return null

    const current = (full || rambu) as RambuItem
    const gpsPhoto = (current.photos || []).find(p => p.type === 1)
    const additionalPhotos = (current.photos || []).filter(p => p.type !== 1)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!rambu) return
        setSaving(true); setErr(null)
        try {
            const fd = new FormData()
            // Rambu fields
            if (categoryId) fd.append('categoryId', categoryId)
            if (disasterTypeId) fd.append('disasterTypeId', disasterTypeId)
            if (lat) fd.append('lat', lat)
            if (lng) fd.append('lng', lng)
            if (provStr) fd.append('prov_id', provStr)
            if (cityStr) fd.append('city_id', cityStr)
            if (distStr) fd.append('district_id', distStr)
            if (subStr) fd.append('subdistrict_id', subStr)

            // Deskripsi / Alamat
            if (description) {
                fd.append('description', description)
                fd.append('address', description) // kompatibilitas
            }

            // RambuProps (opsional)
            if (year) fd.append('year', year)
            if (costId) fd.append('cost_id', costId)
            if (modelId) fd.append('model_id', modelId)
            fd.append('isSimulation', isSimulation ? '1' : '0')

            // Foto
            if (gpsFile) fd.append('photo_gps', gpsFile)
            additionalFiles.forEach((f) => fd.append('photo_additional', f))
            if (removePhotoIds.length) {
                fd.append('removePhotoIds', JSON.stringify(removePhotoIds))
            }

            const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
            const url = `${base}/api/rambu/${current.id}`
            const dataAuth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null
            const token = dataAuth ? JSON.parse(dataAuth).token : null
            const res = await fetch(url, {
                method: 'PUT',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: fd,
            })
            if (!res.ok) {
                const t = await res.text().catch(() => '')
                throw new Error(t || `Gagal update (${res.status})`)
            }
            const updated = await res.json()
            onUpdated?.(updated)
            // refresh parent Rambu table
            // Beri sinyal ke parent untuk refresh tabel
            await queryClient.invalidateQueries({ queryKey: ['rambu-list'] })
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('rambu:refresh'))
            }
            onClose()
        } catch (e: any) {
            setErr(e.message || 'Gagal update')
        } finally {
            setSaving(false)
        }
    }

    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
    function toPhotoUrl(u: string) {
        // jika sudah absolute (http...), kembalikan langsung
        if (/^https?:\/\//i.test(u)) return u
        // jika path mulai dengan /uploads/ atau /public/, gabungkan dengan base
        return `${base}${u.startsWith('/') ? '' : '/'}${u}`
    }

    return (
        <div
            className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-base font-semibold text-slate-800">Edit Rambu #{current.id}</h3>
                    <button onClick={onClose} className="p-2 rounded hover:bg-slate-100" aria-label="Tutup">✕</button>
                </div>
                <form onSubmit={onSubmit} className="p-4 max-h-[90vh] overflow-y-auto text-sm space-y-4">
                    {loadingDetail && <div className="text-xs text-slate-500">Memuat detail…</div>}

                    {/* Koordinat + tombol deteksi */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-700">Koordinat</span>
                            <button
                                type="button"
                                onClick={handleDetectLatLng}
                                disabled={detectingPos}
                                className="text-[11px] px-2 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-60"
                            >
                                {detectingPos ? 'Mendeteksi…' : 'Deteksi wilayah dari lat/lng'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="block text-xs mb-1">Lat</span>
                                <input
                                    value={lat}
                                    //onChange={e => setLat(e.target.value)}
                                    onChange={e => { setLat(e.target.value); setGeoApplied(false); setGeoErr(null) }}
                                    className="w-full rounded border px-2 py-1"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-xs mb-1">Lng</span>
                                <input
                                    value={lng}
                                    //onChange={e => setLng(e.target.value)}
                                    onChange={e => { setLng(e.target.value); setGeoApplied(false); setGeoErr(null) }}
                                    className="w-full rounded border px-2 py-1"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Wilayah (cascading) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label className="block">
                            <span className="block text-xs mb-1">Provinsi</span>
                            <select value={provStr} onChange={e => setProvStr(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {provs?.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kota/Kab</span>
                            <select value={cityStr} onChange={e => setCityStr(e.target.value)} disabled={!provStr} className="w-full rounded border px-2 py-1 disabled:bg-gray-100">
                                <option value="">— pilih —</option>
                                {cities?.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                {!cities?.length && cityStr && (
                                    <option value={cityStr}>#{cityStr}</option>
                                )}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kecamatan</span>
                            <select value={distStr} onChange={e => setDistStr(e.target.value)} disabled={!cityStr} className="w-full rounded border px-2 py-1 disabled:bg-gray-100">
                                <option value="">— pilih —</option>
                                {dists?.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                                {!dists?.length && distStr && (
                                    <option value={distStr}>#{distStr}</option>
                                )}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Kel/Desa</span>
                            <select value={subStr} onChange={e => setSubStr(e.target.value)} disabled={!distStr} className="w-full rounded border px-2 py-1 disabled:bg-gray-100">
                                <option value="">— pilih —</option>
                                {subs?.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                                {!subs?.length && subStr && (
                                    <option value={subStr}>#{subStr}</option>
                                )}
                            </select>
                        </label>
                    </div>

                    {/* Kategori / Bencana (select) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="block">
                            <span className="block text-xs mb-1">Kategori Rambu</span>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {categories?.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                {(!categories?.length && categoryId) && (
                                    <option value={categoryId}>#{categoryId}</option>
                                )}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Jenis Bencana</span>
                            <select value={disasterTypeId} onChange={e => setDisasterTypeId(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {disasters?.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                                {(!disasters?.length && disasterTypeId) && (
                                    <option value={disasterTypeId}>#{disasterTypeId}</option>
                                )}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Deskripsi / Alamat</span>
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full rounded border px-2 py-1"
                                type='text'
                                placeholder="(opsional) deskripsi singkat atau alamat lokasi rambu"
                            />
                        </label>
                    </div>

                    {/* Deskripsi / Alamat */}
                    <div>

                    </div>

                    {/* Props: Tahun / Sumber Dana / Model / isSimulation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="block">
                            <span className="block text-xs mb-1">Tahun</span>
                            <select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Sumber Dana</span>
                            <select value={costId} onChange={e => setCostId(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {costSources?.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                {(!costSources?.length && costId) && <option value={costId}>#{costId}</option>}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs mb-1">Model Rambu</span>
                            <select value={modelId} onChange={e => setModelId(e.target.value)} className="w-full rounded border px-2 py-1">
                                <option value="">— pilih —</option>
                                {models?.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                                {(!models?.length && modelId) && <option value={modelId}>#{modelId}</option>}
                            </select>
                        </label>
                        <label className="inline-flex items-center gap-2 mt-1">
                            <input type="checkbox" checked={isSimulation} onChange={e => setIsSimulation(e.target.checked)} />
                            <span className="text-xs">isSimulation</span>
                        </label>
                    </div>

                    {/* Foto saat ini + upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                            <div className="text-xs font-medium mb-2">Foto GPS</div>
                            {gpsPhoto ? (
                                // <img src={gpsPhoto.url} alt="gps" className="w-full rounded border" />
                                <img src={toPhotoUrl(gpsPhoto.url)} alt="gps" className="w-full rounded border" />
                            ) : (
                                <div className="text-gray-500 text-xs">Tidak ada</div>
                            )}
                            <div className="mt-2">
                                <label className="text-xs block mb-1">Ganti Foto GPS</label>
                                <input type="file" accept="image/*" onChange={e => setGpsFile(e.target.files?.[0] || null)} className="text-xs" />
                            </div>
                        </div>
                        <div className="border rounded p-3">
                            <div className="text-xs font-medium mb-2">Foto Tambahan</div>
                            <div className="grid grid-cols-3 gap-2">
                                {additionalPhotos.map(p => {
                                    const checked = removePhotoIds.includes(p.id)
                                    return (
                                        <div key={p.id} className="relative">
                                            {/* <img src={p.url} alt={`p-${p.id}`} className={`w-full h-20 object-cover rounded border ${checked ? 'opacity-40' : ''}`} /> */}
                                            <img src={toPhotoUrl(p.url)} alt={`p-${p.id}`} className="w-full h-20 object-cover rounded border" />
                                            <label className="absolute top-1 left-1 bg-white/90 text-[10px] px-1 rounded border inline-flex items-center gap-1">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={e => {
                                                        setRemovePhotoIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))
                                                    }}
                                                />
                                                Hapus
                                            </label>
                                        </div>
                                    )
                                })}
                                {additionalPhotos.length === 0 && <div className="text-xs text-gray-500">Tidak ada foto tambahan</div>}
                            </div>
                            <div className="mt-2">
                                <label className="text-xs block mb-1">Tambah Foto Tambahan</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={e => setAdditionalFiles(e.target.files ? Array.from(e.target.files) : [])}
                                    className="text-xs"
                                />
                                <div className="text-[11px] text-gray-500 mt-1">Maks total 4 foto (1 GPS + 3 tambahan). Backend akan batasi otomatis.</div>
                            </div>
                        </div>
                    </div>

                    {err && <div className="text-red-600 text-xs">{err}</div>}

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="rounded bg-gray-200 px-3 py-2 text-sm">Batal</button>
                        <button type="submit" disabled={saving} className="rounded bg-[#004AAD] text-white px-4 py-2 text-sm disabled:opacity-60">
                            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}