import { API_BASE } from './useApi'
import useSWR from 'swr'

export type Rambu = {
    id: number;
    name: string;
    description?: string | null;
    lat: number;
    lng: number;
    disasterTypeId?: number | null;
    image?: string | null;
    categoryId?: number | null;
    category?: {
        id: number;
        name: string;
        code: string;
    } | null;
    disasterType?: {
        id: number;
        name: string;
    } | null;
    prov_id?: number | null;
    city_id?: number | null;
    district_id?: number | null;
    subdistrict_id?: number | null;
    jmlUnit?: number | null;
    rambuProps?: {
        id: number;
        model?: string | null;
        costsource?: string | null;
        year?: number | null;
    } | null;
    model?: string | null;
    costsource?: string | null;
    year?: number | null;
    status?: string | null;
    isSimulation?: number | null;
}

// export function toGeoJSON(items?: Rambu[]) {
//     return {
//         type: 'FeatureCollection',
//         features: (items ?? []).map((it) => ({
//             type: 'Feature',
//             //geometry: { type: 'Point', coordinates: [it.lng, it.lat] },
//             geometry: { type: 'Point', coordinates: [Number(it.lng ?? it.lng), Number(it.lat)] },
//             categoryCode: it.category?.code ?? null,
//             properties: {
//                 ...it,
//                 id: it.id,
//                 name: it.name,
//                 description: it.description,
//                 lat: it.lat,
//                 lng: it.lng,
//                 disasterTypeId: it.disasterTypeId,
//                 image: it.image,
//                 categoryId: it.categoryId,
//                 category: it.category,
//                 disasterType: it.disasterType,
//                 prov_id: it.prov_id,
//                 city_id: it.city_id,
//                 district_id: it.district_id,
//                 subdistrict_id: it.subdistrict_id,
//                 jmlUnit: it.jmlUnit,
//                 model: it.model,
//                 costsource: it.costsource,
//                 year: it.year,
//                 status: it.status,
//                 isSimulation: it.isSimulation,
//             },
//         })),
//     }
// }

export function toGeoJSON(rows: any[]) {
    return {
        type: 'FeatureCollection',
        features: (rows || []).map((r) => {
            const lng = Number(r.lng ?? r.lon)
            const lat = Number(r.lat)
            // Ambil isSimulation dari RambuProps atau langsung dari row
            const rawSim =
                (Array.isArray(r.RambuProps) ? r.RambuProps[0]?.isSimulation : r.RambuProps?.isSimulation) ??
                r.isSimulation ??
                0
            const isSimulation =
                rawSim === true ? 1 : rawSim === '1' ? 1 : rawSim === 'true' ? 1 : Number(rawSim) === 1 ? 1 : 0

            const status = (r.status ?? '').toString().toLowerCase() // 'draft' | 'published' | ''

            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] },
                properties: {
                    id: r.id,
                    name: r.name ?? '',
                    description: r.description ?? r.alamat ?? r.address ?? '',
                    image: r.photos?.[0]?.url ? toPhotoUrl(r.photos[0].url) : undefined,
                    // pastikan properti status & isSimulation tersedia dan bertipe tepat
                    status,
                    isSimulation,
                    // jika perlu, simpan disasterTypeId untuk pewarnaan lama
                    disasterTypeId: Number(r.disasterTypeId ?? r.disaster_type_id ?? NaN),
                    // lokasi untuk filter popup
                    prov_id: Number(r.prov_id ?? r.provinceId ?? NaN),
                    city_id: Number(r.city_id ?? r.cityId ?? NaN),
                    district_id: Number(r.district_id ?? r.districtId ?? NaN),
                    subdistrict_id: Number(r.subdistrict_id ?? r.subdistrictId ?? NaN),
                },
            }
        }).filter((f) => {
            const [lng, lat] = f.geometry.coordinates
            return Number.isFinite(lng) && Number.isFinite(lat)
        }),
    }
}

function toPhotoUrl(u: string) {
    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
    if (/^https?:\/\//i.test(u)) return u
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`
}

const fetcher = async (url: string) => {
    const BASE = (process.env.NEXT_PUBLIC_API_BASE || API_BASE || '').replace(/\/+$/, '')
    const absUrl = url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? '' : '/'}${url}`
    return fetch(absUrl, { headers: { Accept: 'application/json' } }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText} (${absUrl})`)
        return r.json()
    })
}

type UseRambuOptions = {
    enabled?: boolean
    fetchAllWhenUndefined?: boolean
    forceAll?: boolean // jika true selalu ambil semua meski provinceId ada (untuk filter di klien)
    bearerToken?: string | null // optional: kirim token agar bisa akses endpoint yang butuh auth
    preferPublic?: boolean // default true: coba tanpa token dulu supaya bisa tampil walau belum login
    // OPTIONAL FILTERS (server-side)
    cityId?: number
    districtId?: number
    subdistrictId?: number
    categoryId?: number
    disasterTypeId?: number
    modelId?: number
    year?: number
    isSimulation?: number
}

export function useRambu(provinceId?: number, opts: UseRambuOptions = {}) {
    const enabled = opts.enabled ?? true
    const fetchAll = opts.fetchAllWhenUndefined ?? true
    const forceAll = opts.forceAll ?? false
    const preferPublic = opts.preferPublic ?? true
    const bearerToken = opts.bearerToken

    console.log('useRambu', { provinceId, enabled, fetchAll, forceAll });


    // Bangun query params (kirim camelCase dan snake_case untuk kompatibilitas API)
    const qs = new URLSearchParams()
    const addBoth = (camel: string, snake: string, val?: number) => {
        if (val == null) return
        qs.set(camel, String(val))
        qs.set(snake, String(val))
    }
    addBoth('provinceId', 'prov_id', provinceId)
    addBoth('cityId', 'city_id', opts.cityId)
    addBoth('districtId', 'district_id', opts.districtId)
    addBoth('subdistrictId', 'subdistrict_id', opts.subdistrictId)
    addBoth('categoryId', 'category_id', opts.categoryId)
    addBoth('disasterTypeId', 'disaster_type_id', opts.disasterTypeId)
    addBoth('modelId', 'model_id', opts.modelId)
    addBoth('isSimulation', 'is_simulation', opts.isSimulation)

    if (opts.year != null) {
        qs.set('year', String(opts.year))
        qs.set('tahun', String(opts.year))
    }

    const qstr = qs.toString()
    const withQuery = (base: string) => (qstr ? `${base}?${qstr}` : base)


    // const path =
    //     forceAll
    //         ? '/api/rambu'
    //         : provinceId != null
    //             ? `/api/rambu?provinceId=${provinceId}`
    //             : fetchAll
    //                 ? '/api/rambu'
    //                 : null
    // const path =
    //     forceAll
    //         ? withQuery('/api/rambu')
    //         : (provinceId != null || qstr)
    //             ? withQuery('/api/rambu')
    //             : fetchAll
    //                 ? '/api/rambu'
    //                 : null

    const path =
        forceAll
            ? withQuery('/api/rambu')
            : (provinceId != null || qstr)
                ? withQuery('/api/rambu')
                : fetchAll
                    ? '/api/rambu'
                    : null


    if (path) {
        const BASE = (process.env.NEXT_PUBLIC_API_BASE || API_BASE || '').replace(/\/+$/, '')
        const absUrl = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
        console.debug('[useRambu] GET:', absUrl)
    }
    const swr = useSWR<Rambu[]>(
        enabled && path ? path : null,
        async (url: string) => {
            const base = process.env.NEXT_PUBLIC_API_BASE || API_BASE || ''
            // Safe join untuk hindari /api/api/...
            const absUrl = new URL(url, base).toString()
            const headers: Record<string, string> = { Accept: 'application/json' }

            const parseJson = async (res: Response) => {
                const json = await res.json()
                return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
            }

            // Strategi: coba publik dulu, jika gagal dan ada token → ulang dengan token.
            if (preferPublic) {
                let res = await fetch(absUrl, { headers })
                if ((res.status === 401 || res.status === 403) && bearerToken) {
                    res = await fetch(absUrl, { headers: { ...headers, Authorization: `Bearer ${bearerToken}` } })
                }
                if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (${absUrl})`)
                return parseJson(res)
            }

            // Jika preferPublic=false: coba token dulu, lalu fallback publik.
            if (bearerToken) {
                const res = await fetch(absUrl, { headers: { ...headers, Authorization: `Bearer ${bearerToken}` } })
                if (res.ok) return parseJson(res)
                if (res.status !== 401 && res.status !== 403) throw new Error(`HTTP ${res.status} ${res.statusText} (${absUrl})`)
            }

            const res = await fetch(absUrl, { headers })
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (${absUrl})`)
            return parseJson(res)
        },
        {
        revalidateOnFocus: false,
    })

    return {
        data: swr.data,
        loading: swr.isLoading,
        error: swr.error as Error | undefined,
        mutate: swr.mutate, // untuk refetch manual
    }
}

// export async function fetchRambu(provId?: number): Promise<Rambu[]> {
//     const u = new URL(`${API_BASE}/api/rambu`)
//     if (provId) u.searchParams.set('prov_id', String(provId))
//     const res = await fetch(u.toString(), { cache: 'no-store' })
//     if (!res.ok) throw new Error(`rambu ${res.status}`)
//     return res.json()
// }

// import { useEffect, useState } from 'react'
// export function useRambu(provId?: number) {
//     const [data, setData] = useState<Rambu[] | null>(null)
//     const [loading, setLoading] = useState(false)
//     const [error, setError] = useState<string | null>(null)

//     useEffect(() => {
//         let alive = true
//         setLoading(true); setError(null)
//         fetchRambu(provId).then(d => {
//             if (!alive) return
//             setData(d)
//         }).catch(e => alive && setError(String(e)))
//             .finally(() => alive && setLoading(false))
//         return () => { alive = false }
//     }, [provId])

//     return { data: data || [], loading, error }
// }
