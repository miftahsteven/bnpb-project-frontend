'use client'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
    useProvinces,
    useCities,
    useDistricts,
    useSubdistricts,
} from '@/hooks/useCascadingLocations'
import { useCategories, useDisasterTypes, useModels, useCostSources } from '@/hooks/useOptions'


type QueryState = {
    page: number
    pageSize: number
    search?: string
    status?: string
    categoryId?: number
    disasterTypeId?: number
    modelId?: number
    costSourceId?: number
    prov_id?: number
    city_id?: number
    district_id?: number
    subdistrict_id?: number
    year?: number
    isSimulation?: number
}

interface Props {
    open: boolean
    query: QueryState
    onApply: (filters: Partial<QueryState>) => void
    onClose: () => void
}

export default function RambuFilter({ open, query, onApply, onClose }: Props) {
    const [provStr, setProvStr] = useState<string>('')
    const [cityStr, setCityStr] = useState<string>('')
    const [distStr, setDistStr] = useState<string>('')
    const [subdistStr, setSubdistStr] = useState<string>('')
    const [categoryStr, setCategoryStr] = useState<string>('')
    const [disasterTypeStr, setDisasterTypeStr] = useState<string>('')
    const [modelStr, setModelStr] = useState<string>('')
    const [costSourceStr, setCostSourceStr] = useState<string>('')
    const [statusStr, setStatusStr] = useState<string>('')
    const [yearStr, setYearStr] = useState<string>('')

    // Flag untuk mencegah reset child saat prefill
    const [isHydrating, setIsHydrating] = useState(false)
    const prevProv = useRef<string>('')
    const prevCity = useRef<string>('')

    // Prefill dari query saat modal dibuka
    useEffect(() => {
        if (!open) return
        setIsHydrating(true)
        setProvStr(query.prov_id != null ? String(query.prov_id) : '')
        setCityStr(query.city_id != null ? String(query.city_id) : '')
        setDistStr(query.district_id != null ? String(query.district_id) : '')
        setSubdistStr(query.subdistrict_id != null ? String(query.subdistrict_id) : '')
        setCategoryStr(query.categoryId != null ? String(query.categoryId) : '')
        setDisasterTypeStr(query.disasterTypeId != null ? String(query.disasterTypeId) : '')
        setModelStr(query.modelId != null ? String(query.modelId) : '')
        setCostSourceStr(query.costSourceId != null ? String(query.costSourceId) : '')
        setStatusStr(query.isSimulation === 1 ? 'simulation' : (query.status || ''))
        setYearStr(query.year != null ? String(query.year) : '')
        // Matikan hydrasi setelah flush microtask
        setTimeout(() => setIsHydrating(false), 0)
    }, [
        open,
        query.prov_id,
        query.city_id,
        query.district_id,
        query.subdistrict_id,
        query.categoryId,
        query.disasterTypeId,
        query.modelId,
        query.costSourceId,
        query.status,
        query.isSimulation,
        query.year,
    ])

    // Reset child ketika parent berubah (interaksi user)
    // Reset cascading hanya saat perubahan user (bukan saat hydrating)
    useEffect(() => {
        if (isHydrating) { prevProv.current = provStr; return }
        if (prevProv.current && prevProv.current !== provStr) {
            setCityStr('')
            setDistStr('')
            setSubdistStr('')
        }
        prevProv.current = provStr
    }, [provStr, isHydrating])
    useEffect(() => {
        if (isHydrating) { prevCity.current = cityStr; return }
        if (prevCity.current && prevCity.current !== cityStr) {
            setDistStr('')
            setSubdistStr('')
        }
        prevCity.current = cityStr
    }, [cityStr, isHydrating])
    useEffect(() => {
        if (isHydrating) return
        // Jika kecamatan berubah oleh user, kosongkan kelurahan
        // (hindari saat hydrating)
        // distStr efek di atas sudah handle subdistrict
    }, [distStr, isHydrating])

    const provNum = provStr ? Number(provStr) : undefined
    const cityNum = cityStr ? Number(cityStr) : undefined
    const distNum = distStr ? Number(distStr) : undefined

    const { data: provs } = useProvinces()
    const { data: cities } = useCities(provNum)
    const { data: dists } = useDistricts(cityNum)
    const { data: subdists } = useSubdistricts(distNum)
    const { data: categories, loading: loadingCat } = useCategories()
    const { data: disasters, loading: loadingDis } = useDisasterTypes()
    const { data: models, loading: loadingModel } = useModels()
    const { data: costSources, loading: loadingCostSource } = useCostSources()

    function applyFilters() {
        onApply({
            prov_id: provStr ? Number(provStr) : undefined,
            city_id: cityStr ? Number(cityStr) : undefined,
            district_id: distStr ? Number(distStr) : undefined,
            subdistrict_id: subdistStr ? Number(subdistStr) : undefined,
            categoryId: categoryStr ? Number(categoryStr) : undefined,
            disasterTypeId: disasterTypeStr ? Number(disasterTypeStr) : undefined,
            modelId: modelStr ? Number(modelStr) : undefined,
            costSourceId: costSourceStr ? Number(costSourceStr) : undefined,
            status: statusStr === 'simulation' ? 'draft' : (statusStr || undefined),
            isSimulation: statusStr === 'simulation' ? 1 : undefined,
            year: yearStr ? Number(yearStr) : undefined,
            // Reset halaman ke 1
            page: 1,
        })
    }

    const yearOptions = useMemo(() => {
        const now = new Date().getFullYear()
        const from = 2005
        const arr: number[] = []
        for (let y = now; y >= from; y--) arr.push(y)
        return arr
    }, [])

    if (!open) return null

    return (
        <div
            //className="fixed inset-0 z-[2050] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            className="fixed inset-0 z-[2050] bg-black/60 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-lg rounded-xl shadow-2xl border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-base font-semibold text-slate-800">Filter Wilayah</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-slate-100"
                        aria-label="Tutup"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-4 space-y-4 text-sm">
                    {/* Provinsi */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <label className="block">
                            <span className="block text-xs mb-1">Provinsi</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={provStr}
                                onChange={(e) => setProvStr(e.target.value)}
                            >
                                <option value="">— Semua —</option>
                                {provs?.map(p => (
                                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Kota */}
                        <label className="block">
                            <span className="block text-xs mb-1">Kota / Kabupaten</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={cityStr}
                                onChange={(e) => setCityStr(e.target.value)}
                                disabled={!provStr}
                            >
                                <option value="">— Semua —</option>
                                {cities?.map(c => (
                                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Kecamatan */}
                        <label className="block">
                            <span className="block text-xs mb-1">Kecamatan</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={distStr}
                                onChange={(e) => setDistStr(e.target.value)}
                                disabled={!cityStr}
                            >
                                <option value="">— Semua —</option>
                                {dists?.map(d => (
                                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                                ))}
                            </select>
                        </label>


                        {/* Kelurahan */}
                        <label className="block">
                            <span className="block text-xs mb-1">Kelurahan / Desa</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={subdistStr}
                                onChange={(e) => setSubdistStr(e.target.value)}
                                disabled={!distStr}
                            >
                                <option value="">— Semua —</option>
                                {subdists?.map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Kategori Rambu */}
                        <label className="block">
                            <span className="block text-xs mb-1">Kategori Rambu</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={categoryStr}
                                onChange={(e) => setCategoryStr(e.target.value)}
                                disabled={loadingCat}
                            >
                                <option value="">— Semua —</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Tipe Bencana */}
                        <label className="block">
                            <span className="block text-xs mb-1">Tipe Bencana</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={disasterTypeStr}
                                onChange={(e) => setDisasterTypeStr(e.target.value)}
                                disabled={loadingDis}
                            >
                                <option value="">— Semua —</option>
                                {disasters?.map(dis => (
                                    <option key={dis.id} value={String(dis.id)}>{dis.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Model Rambu */}
                        <label className="block">
                            <span className="block text-xs mb-1">Model Rambu</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={modelStr}
                                onChange={(e) => setModelStr(e.target.value)}
                                disabled={loadingModel}
                            >
                                <option value="">— Semua —</option>
                                {models?.map(mod => (
                                    <option key={mod.id} value={String(mod.id)}>{mod.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Sumber Biaya */}
                        <label className="block">
                            <span className="block text-xs mb-1">Sumber Biaya</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={costSourceStr}
                                onChange={(e) => setCostSourceStr(e.target.value)}
                                disabled={loadingCostSource}
                            >
                                <option value="">— Semua —</option>
                                {costSources?.map(cs => (
                                    <option key={cs.id} value={String(cs.id)}>{cs.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Status */}
                        <label className="block">
                            <span className="block text-xs mb-1">Status Rambu</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={statusStr}
                                onChange={(e) => setStatusStr(e.target.value)}
                            >
                                <option value="">— Semua —</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="simulation">Simulasi</option>
                            </select>
                        </label>
                        {/* Tahun Dibuat */}
                        <label className="block">
                            <span className="block text-xs mb-1">Tahun Dibuat</span>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={yearStr}
                                onChange={(e) => setYearStr(e.target.value)}
                            >
                                <option value="">— Semua —</option>
                                {yearOptions.map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded border text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={applyFilters}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </div>
    )
}