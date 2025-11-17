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
}

export function toGeoJSON(items?: Rambu[]) {
    return {
        type: 'FeatureCollection',
        features: (items ?? []).map((it) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [it.lng, it.lat] },
            categoryCode: it.category?.code ?? null,
            properties: { ...it },
        })),
    }
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
}

export function useRambu(provinceId?: number, opts: UseRambuOptions = {}) {
    const enabled = opts.enabled ?? true
    const fetchAll = opts.fetchAllWhenUndefined ?? true
    const forceAll = opts.forceAll ?? false

    const path =
        forceAll
            ? '/api/rambu'
            : provinceId != null
                ? `/api/rambu?provinceId=${provinceId}`
                : fetchAll
                    ? '/api/rambu'
                    : null

    const swr = useSWR<Rambu[]>(enabled && path ? path : null, fetcher, {
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
