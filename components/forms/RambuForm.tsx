'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from './Select'
import FileInput from './FileInput'
import { useCategories, useDisasterTypes, useModels, useCostSources } from '@/hooks/useOptions'
import {
    useProvinces, useCities, useDistricts, useSubdistricts
} from '@/hooks/useCascadingLocations'
import { apiPostForm } from '@/lib/api'
import { toFormData } from '@/lib/toFormData'
import { use, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'


const schema = z.object({
    //name: z.string().min(1, 'Nama wajib diisi'),
    description: z.string().optional(),
    lat: z.string().min(1, 'Latitude wajib diisi'),
    lng: z.string().min(1, 'Longitude wajib diisi'),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    disasterTypeId: z.string().min(1, 'Jenis bencana wajib dipilih'),
    prov_id: z.string().optional(),
    city_id: z.string().optional(),
    district_id: z.string().optional(),
    subdistrict_id: z.string().optional(),
    model_id: z.string().optional(),
    cost_id: z.string().optional(),
    year: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function RambuForm() {
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
        useForm<FormValues>({ resolver: zodResolver(schema) })

    // Kategori & Jenis Bencana
    const { data: categories, loading: loadingCat } = useCategories()
    const { data: disasters, loading: loadingDis } = useDisasterTypes()
    const { data: models, loading: loadingModel } = useModels()
    const { data: costSources, loading: loadingCostSource } = useCostSources()

    // Wilayah berjenjang
    const provStr = watch('prov_id') || ''
    const cityStr = watch('city_id') || ''
    const distStr = watch('district_id') || ''

    const provId = provStr ? Number(provStr) : undefined
    const cityId = cityStr ? Number(cityStr) : undefined
    const districtId = distStr ? Number(distStr) : undefined
    const modelId = distStr ? Number(distStr) : undefined

    const { data: provs, loading: loadingProv } = useProvinces()
    const { data: cities, loading: loadingCity } = useCities(provId)
    const { data: districts, loading: loadingDist } = useDistricts(cityId)
    const { data: subs, loading: loadingSub } = useSubdistricts(districtId)

    const { token } = useAuth()

    // Reset anak ketika parent berubah
    useEffect(() => { setValue('city_id', ''); setValue('district_id', ''); setValue('subdistrict_id', '') }, [provId])
    useEffect(() => { setValue('district_id', ''); setValue('subdistrict_id', '') }, [cityId])
    useEffect(() => { setValue('subdistrict_id', '') }, [districtId])
    //useEffect(() => { setValue('model_id', '') }, [modelId])

    const [submitMsg, setSubmitMsg] = useState<string | null>(null)
    const [submitErr, setSubmitErr] = useState<string | null>(null)

    // State untuk input file tambahan (maks total 4 termasuk photo_gps)
    const [extraPhotos, setExtraPhotos] = useState<string[]>([])

    function addFileInput() {
        // photo_gps sudah 1, batas total 4 → tambahan maksimal 3
        if (extraPhotos.length >= 3) return
        const nextIndex = extraPhotos.length + 1
        setExtraPhotos(prev => [...prev, `photo_additional_${nextIndex}`])
    }

    function removeFileInput(name: string) {
        setExtraPhotos(prev => prev.filter(n => n !== name))
    }


    // Geografis auto-fill state
    const latVal = watch('lat')
    const lngVal = watch('lng')
    const [geoLoading, setGeoLoading] = useState(false)
    const [geoErr, setGeoErr] = useState<string | null>(null)
    const [geoApplied, setGeoApplied] = useState(false)

    // Helper tunggu data hook lokasi tersedia
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

    const applyGeografis = useCallback(async (geo: any) => {
        setGeoApplied(false)
        // 1. Province
        const provFound = provs?.find(p => p.name?.toLowerCase() === geo.province?.toLowerCase())
        if (provFound) {
            setValue('prov_id', String(provFound.id))
        } else {
            setGeoErr('Provinsi tidak ditemukan di referensi lokal.')
            return
        }
        // Tunggu cities ter-load
        const cityList = await waitFor(() => {
            const pid = provFound.id
            return cities && cities.length ? cities : null
        })
        const cityFound = cityList?.find((c: any) => c.name?.toLowerCase() === geo.city?.toLowerCase())
        if (cityFound) {
            setValue('city_id', String(cityFound.id))
        } else {
            setGeoErr('Klik Untuk Mendapatkan Kota/Kab.')
            return
        }
        // Tunggu districts
        const distList = await waitFor(() => (districts && districts.length ? districts : null))
        const distFound = distList?.find((d: any) => d.name?.toLowerCase() === geo.district?.toLowerCase())
        if (distFound) {
            setValue('district_id', String(distFound.id))
        } else {
            setGeoErr('Klik untuk mendapatkan kecamatan.')
            return
        }
        // Tunggu subdistricts
        const subList = await waitFor(() => (subs && subs.length ? subs : null))
        const subFound = subList?.find((s: any) => s.name?.toLowerCase() === geo.village?.toLowerCase())
        if (subFound) {
            setValue('subdistrict_id', String(subFound.id))
        } else {
            // Village bisa tidak ada; tidak fatal
            setGeoErr('Kelurahan/Desa tidak ditemukan (opsional).')
        }
        setGeoApplied(true)
    }, [provs, cities, districts, subs, setValue])

    async function detectGeografis() {
        setGeoErr(null); setGeoLoading(true); setGeoApplied(false)
        // Validasi lat/lng number
        const latNum = Number(latVal)
        const lngNum = Number(lngVal)
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
            setGeoErr('Latitude/Longitude tidak valid.')
            setGeoLoading(false)
            return
        }
        try {
            const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
            const url = `${base}/api/ref/geografis`; //?lat=${encodeURIComponent(latNum)}&lng=${encodeURIComponent(lngNum)}`
            const body = { lat: latNum, long: lngNum }
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setGeoLoading(false)
                return
            }
            await applyGeografis(geo)
        } catch (e: any) {
            setGeoErr(e?.message || 'Deteksi geografis gagal, coba lagi.')
        } finally {
            setGeoLoading(false)
        }
    }

    // Optional: auto trigger ketika lat & lng diubah dan length cukup
    // useEffect(() => {
    //     setGeoErr(null)
    //     setGeoApplied(false)
    //     // Hanya auto jika user sudah isi keduanya dan keduanya angka
    //     const latNum = Number(latVal)
    //     const lngNum = Number(lngVal)
    //     if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    //         // Debounce 700ms
    //         const h = setTimeout(() => {
    //             detectGeografis()
    //         }, 700)
    //         return () => clearTimeout(h)
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [latVal, lngVal])


    async function onSubmit(values: FormValues) {
        setSubmitMsg(null); setSubmitErr(null)

        // Ambil file dari DOM
        const f = document.querySelector('form#rambuForm') as HTMLFormElement
        // const photo_gps = (f.elements.namedItem('photo_gps') as HTMLInputElement)?.files?.[0]
        // const photo_0 = (f.elements.namedItem('photo_0') as HTMLInputElement)?.files?.[0]
        // const photo_50 = (f.elements.namedItem('photo_50') as HTMLInputElement)?.files?.[0]
        // const photo_100 = (f.elements.namedItem('photo_100') as HTMLInputElement)?.files?.[0]
        //sesuaikan dengan penamaan input file
        const photo_gps = (f.elements.namedItem('photo_gps') as HTMLInputElement)?.files?.[0]

        const photo_0 = extraPhotos.length >= 1 ? (f.elements.namedItem(extraPhotos[0]) as HTMLInputElement)?.files?.[0] : null
        const photo_50 = extraPhotos.length >= 2 ? (f.elements.namedItem(extraPhotos[1]) as HTMLInputElement)?.files?.[0] : null
        const photo_100 = extraPhotos.length >= 3 ? (f.elements.namedItem(extraPhotos[2]) as HTMLInputElement)?.files?.[0] : null

        const fd = toFormData({
            ...values,
            // biarkan BE yang coercion ke number
        })

        // pastikan lat lng valid number-string
        if (values.lat?.trim() === "") {
            delete (values as any).lat;
        }
        if (values.lng?.trim() === "") {
            delete (values as any).lng;
        }

        // if (photo_gps) fd.append('photo_gps', photo_gps)
        // if (photo_0) fd.append('photo_0', photo_0)
        // if (photo_50) fd.append('photo_50', photo_50)
        // if (photo_100) fd.append('photo_100', photo_100)
        if (photo_gps) fd.append('photo_gps', photo_gps)
        if (photo_0) fd.append('photo_additional_1', photo_0)
        if (photo_50) fd.append('photo_additional_2', photo_50)
        if (photo_100) fd.append('photo_additional_3', photo_100)

        try {
            await apiPostForm('/api/rambu', fd, { token: token ?? undefined })
            setSubmitMsg('Data rambu berhasil disimpan.')
            f.reset()
            setValue('prov_id', ''); setValue('city_id', ''); setValue('district_id', ''); setValue('subdistrict_id', '')
        } catch (e: any) {
            setSubmitErr(e?.message ?? 'Gagal menyimpan.')
        }
    }

    return (
        <form id="rambuForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {/* <label className="block">
                    <span className="block text-sm mb-1">Nama Rambu</span>
                    <input {...register('name')} className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]" />
                    {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </label> */}

                <Select label="Rambu" {...register('categoryId')} loading={loadingCat} placeholder="— pilih kategori —">
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>

                <label className="block">
                    <span className="block text-sm mb-1">Deskripsi / Alamat</span>
                    <input {...register('description')} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </label>

                {/* <label className="block">
                    <span className="block text-sm mb-1">Latitude</span>
                    <input {...register('lat')} placeholder="-6.2" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    {errors.lat && <p className="text-xs text-red-600">{errors.lat.message}</p>}
                </label>

                <label className="block">
                    <span className="block text-sm mb-1">Longitude</span>
                    <input {...register('lng')} placeholder="106.8" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    {errors.lng && <p className="text-xs text-red-600">{errors.lng.message}</p>}
                </label> */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* ...existing inputs... */}
                    <label className="block">
                        <span className="block text-sm mb-1">Latitude</span>
                        <input {...register('lat')} placeholder="-7.68" className="w-full rounded-lg border px-3 py-2 text-sm" />
                        {errors.lat && <p className="text-xs text-red-600">{errors.lat.message}</p>}
                    </label>
                    <label className="block">
                        <span className="block text-sm mb-1">Longitude</span>
                        <input {...register('lng')} placeholder="109.08" className="w-full rounded-lg border px-3 py-2 text-sm" />
                        {errors.lng && <p className="text-xs text-red-600">{errors.lng.message}</p>}
                    </label>
                </div>
                <div className="flex items-center gap-3 text-md mt-6">
                    <button
                        type="button"
                        onClick={detectGeografis}
                        disabled={geoLoading || !latVal || !lngVal}
                        className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
                    >
                        {geoLoading ? 'Deteksi…' : 'Deteksi Lokasi'}
                    </button>
                    {geoApplied && <span className="text-green-400">Lokasi Terisi, Silahkan Cek.</span>}
                    {geoErr && <span className="text-red-600">{geoErr}</span>}
                </div>

                <Select label="Provinsi" {...register('prov_id')} loading={loadingProv} placeholder="— pilih provinsi —">
                    {provs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>

                <Select label="Kota/Kabupaten" {...register('city_id')} disabled={!provId} loading={loadingCity} placeholder="— pilih kota/kabupaten —">
                    {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>

                <Select label="Kecamatan" {...register('district_id')} disabled={!cityId} loading={loadingDist} placeholder="— pilih kecamatan —">
                    {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>

                <Select label="Kelurahan/Desa" {...register('subdistrict_id')} disabled={!districtId} loading={loadingSub} placeholder="— pilih kelurahan/desa —">
                    {subs?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>

                <Select label="Jenis Kebencanaan" {...register('disasterTypeId')} loading={loadingDis} placeholder="— pilih jenis bencana —">
                    {disasters?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>

                <Select label="Model" {...register('model_id')} loading={loadingModel} placeholder="— pilih Model Rambu —">
                    {models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>

                <Select label="Sumber Dana" {...register('cost_id')} loading={loadingCostSource} placeholder="— Pilih Sumber Dana —">
                    {costSources?.map(cs => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
                </Select>
                <label className="block">
                    <span className="block text-sm mb-1">Tahun Anggaran</span>
                    {/* <input {...register('year')} type="number" min={2022} max={2100} className="w-full rounded-lg border px-3 py-2 text-sm" /> */}
                    <Select label="" {...register('year')} placeholder="— Pilih Tahun —">
                        {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() - 5 + i
                            return <option key={year} value={year}>{year}</option>
                        })}
                    </Select>
                </label>

                {/* <label className="block">
                    <span className="block text-sm mb-1">Jumlah Unit</span>
                    <input {...register('jmlUnit')} type="number" min={0} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </label> */}
            </div>

            {/* <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4 p-3 rounded-xl border bg-white/80">
                <FileInput label="Foto GPS (disarankan)" name="photo_gps" />
                <FileInput label="Pemasangan 0%" name="photo_0" />
                <FileInput label="Pemasangan 50%" name="photo_50" />
                <FileInput label="Pemasangan 100%" name="photo_100" />
            </div> */}
            {/* buatkan input file minimal 1 buah FileInput. Lalu ada icon + untuk bisa tambah FileInput jika gambar lebih dari 1
            dan penambahan gambar maximal 4 gambar */}
            <div id="fileInputsContainer" className="space-y-2 grid gap-4 md:grid-cols-4 lg:grid-cols-4 p-3 rounded-xl border bg-white/80">
                <label className="block">
                    <span className="block text-sm mb-1">Foto GPS Rambu (Wajib 1 Gbr)</span>
                    <FileInput name="photo_gps" label={''} />
                </label>
                {extraPhotos.map((name, i) => (
                    <label key={name} className="block relative">
                        <span className="block text-sm mb-1">Foto Tambahan {i + 1}</span>
                        <FileInput name={name} label="" />
                        <button
                            type="button"
                            onClick={() => removeFileInput(name)}
                            className="absolute top-0 right-0 text-xs text-red-600 hover:underline"
                        >
                            Hapus
                        </button>
                    </label>
                ))}
            </div>
            {/* Button tambah file input */}
            <button
                type="button"
                onClick={addFileInput}
                className="text-sm text-blue-600 hover:underline"
                disabled={extraPhotos.length >= 3}
            >
                + Tambah Foto Tambahan
            </button>
            {extraPhotos.length >= 3 && (
                <p className="text-xs text-gray-500">Maksimal 4 foto (1 wajib + 3 tambahan) tercapai.</p>
            )}


            <div className="flex items-center gap-3">
                <button
                    disabled={isSubmitting}
                    className="rounded-lg bg-[#004AAD] px-4 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    type="submit"
                >
                    {isSubmitting ? 'Menyimpan…' : 'Simpan Rambu'}
                </button>
                {submitMsg && <span className="text-green-700 text-sm">{submitMsg}</span>}
                {submitErr && <span className="text-red-700 text-sm">{submitErr}</span>}
            </div>
        </form>
    )
}
