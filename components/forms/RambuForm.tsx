'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from './Select'
import FileInput from './FileInput'
import { useCategories, useDisasterTypes } from '@/hooks/useOptions'
import {
    useProvinces, useCities, useDistricts, useSubdistricts
} from '@/hooks/useCascadingLocations'
import { apiPostForm } from '@/lib/api'
import { toFormData } from '@/lib/toFormData'
import { useEffect, useState } from 'react'

const schema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    description: z.string().optional(),
    lat: z.string().min(1, 'Latitude wajib diisi'),
    lng: z.string().min(1, 'Longitude wajib diisi'),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    disasterTypeId: z.string().min(1, 'Jenis bencana wajib dipilih'),
    prov_id: z.string().optional(),
    city_id: z.string().optional(),
    district_id: z.string().optional(),
    subdistrict_id: z.string().optional(),
    jmlUnit: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function RambuForm() {
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
        useForm<FormValues>({ resolver: zodResolver(schema) })

    // Kategori & Jenis Bencana
    const { data: categories, loading: loadingCat } = useCategories()
    const { data: disasters, loading: loadingDis } = useDisasterTypes()

    // Wilayah berjenjang
    const provStr = watch('prov_id') || ''
    const cityStr = watch('city_id') || ''
    const distStr = watch('district_id') || ''

    const provId = provStr ? Number(provStr) : undefined
    const cityId = cityStr ? Number(cityStr) : undefined
    const districtId = distStr ? Number(distStr) : undefined

    const { data: provs, loading: loadingProv } = useProvinces()
    const { data: cities, loading: loadingCity } = useCities(provId)
    const { data: districts, loading: loadingDist } = useDistricts(cityId)
    const { data: subs, loading: loadingSub } = useSubdistricts(districtId)

    // Reset anak ketika parent berubah
    useEffect(() => { setValue('city_id', ''); setValue('district_id', ''); setValue('subdistrict_id', '') }, [provId])
    useEffect(() => { setValue('district_id', ''); setValue('subdistrict_id', '') }, [cityId])
    useEffect(() => { setValue('subdistrict_id', '') }, [districtId])

    const [submitMsg, setSubmitMsg] = useState<string | null>(null)
    const [submitErr, setSubmitErr] = useState<string | null>(null)

    async function onSubmit(values: FormValues) {
        setSubmitMsg(null); setSubmitErr(null)

        // Ambil file dari DOM
        const f = document.querySelector('form#rambuForm') as HTMLFormElement
        const photo_gps = (f.elements.namedItem('photo_gps') as HTMLInputElement)?.files?.[0]
        const photo_0 = (f.elements.namedItem('photo_0') as HTMLInputElement)?.files?.[0]
        const photo_50 = (f.elements.namedItem('photo_50') as HTMLInputElement)?.files?.[0]
        const photo_100 = (f.elements.namedItem('photo_100') as HTMLInputElement)?.files?.[0]

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

        if (photo_gps) fd.append('photo_gps', photo_gps)
        if (photo_0) fd.append('photo_0', photo_0)
        if (photo_50) fd.append('photo_50', photo_50)
        if (photo_100) fd.append('photo_100', photo_100)

        try {
            await apiPostForm('/api/rambu', fd)
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
                <label className="block">
                    <span className="block text-sm mb-1">Nama Rambu</span>
                    <input {...register('name')} className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#004AAD]" />
                    {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </label>

                <label className="block">
                    <span className="block text-sm mb-1">Deskripsi / Alamat</span>
                    <input {...register('description')} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </label>

                <label className="block">
                    <span className="block text-sm mb-1">Latitude</span>
                    <input {...register('lat')} placeholder="-6.2" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    {errors.lat && <p className="text-xs text-red-600">{errors.lat.message}</p>}
                </label>

                <label className="block">
                    <span className="block text-sm mb-1">Longitude</span>
                    <input {...register('lng')} placeholder="106.8" className="w-full rounded-lg border px-3 py-2 text-sm" />
                    {errors.lng && <p className="text-xs text-red-600">{errors.lng.message}</p>}
                </label>

                <Select label="Kategori Rambu" {...register('categoryId')} loading={loadingCat} placeholder="— pilih kategori —">
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>

                <Select label="Jenis Kebencanaan" {...register('disasterTypeId')} loading={loadingDis} placeholder="— pilih jenis bencana —">
                    {disasters?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>

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

                <label className="block">
                    <span className="block text-sm mb-1">Jumlah Unit</span>
                    <input {...register('jmlUnit')} type="number" min={0} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4 p-3 rounded-xl border bg-white/80">
                <FileInput label="Foto GPS (disarankan)" name="photo_gps" />
                <FileInput label="Pemasangan 0%" name="photo_0" />
                <FileInput label="Pemasangan 50%" name="photo_50" />
                <FileInput label="Pemasangan 100%" name="photo_100" />
            </div>

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
