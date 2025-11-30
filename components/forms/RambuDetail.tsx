'use client'
import React, { useEffect, useState } from 'react'

type Props = {
    open: boolean
    id: number
    onClose: () => void
}

type Detail = {
    id: number
    name?: string | null
    description?: string | null
    lat?: number | null
    lng?: number | null
    categoryName?: string | null
    disasterTypeName?: string | null
    provinceName?: string | null
    cityName?: string | null
    districtName?: string | null
    subdistrictName?: string | null
    status?: string | null
    isSimulation?: number
    photos?: { id: number; url: string; type: number }[]
    createdAt?: string
}

export default function RambuDetail({ open, id, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [detail, setDetail] = useState<Detail | null>(null)

    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')

    function toPhotoUrl(u: string) {
        if (/^https?:\/\//i.test(u)) return u
        return `${base}${u.startsWith('/') ? '' : '/'}${u}`
    }

    useEffect(() => {
        if (!open || !id) return
        let aborted = false
            ; (async () => {
                setLoading(true); setErr(null)
                try {
                    const auth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null
                    const token = auth ? JSON.parse(auth).token : null
                    const res = await fetch(`${base}/api/rambu-detail/${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    })
                    if (!res.ok) throw new Error(`Gagal memuat detail (${res.status})`)
                    const json = await res.json()
                    // backend: { data: dataFormatted, status: 'success', code: 200 }
                    const payload: Detail | null = json?.data ?? null
                    if (!aborted) setDetail(payload)
                } catch (e: any) {
                    if (!aborted) setErr(e?.message || 'Gagal memuat detail')
                } finally {
                    if (!aborted) setLoading(false)
                }
            })()
        return () => { aborted = true }
    }, [open, id])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[2100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-base font-semibold text-slate-800">Detail Rambu #{id}</h3>
                    <button onClick={onClose} className="p-2 rounded hover:bg-slate-100" aria-label="Tutup">✕</button>
                </div>
                <div className="p-4 space-y-3 text-sm">
                    {loading ? (
                        <div className="text-slate-500 text-sm">Memuat…</div>
                    ) : err ? (
                        <div className="text-red-600 text-sm">{err}</div>
                    ) : detail ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs text-slate-500">Kategori</div>
                                    <div className="font-medium">{detail.categoryName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Tipe Bencana</div>
                                    <div className="font-medium">{detail.disasterTypeName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Provinsi</div>
                                    <div className="font-medium">{detail.provinceName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Kota/Kab</div>
                                    <div className="font-medium">{detail.cityName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Kecamatan</div>
                                    <div className="font-medium">{detail.districtName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Kelurahan/Desa</div>
                                    <div className="font-medium">{detail.subdistrictName || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Koordinat</div>
                                    <div className="font-medium">
                                        {detail.lat != null && detail.lng != null ? `${detail.lat}, ${detail.lng}` : '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Status</div>
                                    <div className="font-medium">
                                        {detail.isSimulation ? 'Simulasi' : detail.status === 'published' ? 'Published' : 'Draft'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Deskripsi</div>
                                <div className="font-normal">{detail.description || '-'}</div>
                            </div>

                            {detail.photos && detail.photos.length > 0 && (
                                <div>
                                    <div className="text-xs text-slate-500 mb-2">Foto</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {detail.photos.map(p => (
                                            <img key={p.id} src={toPhotoUrl(p.url)} alt={`foto-${p.id}`} className="w-full h-full object-cover rounded border" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-slate-500 text-sm">Tidak ada detail.</div>
                    )}
                </div>
            </div>
        </div>
    )
}