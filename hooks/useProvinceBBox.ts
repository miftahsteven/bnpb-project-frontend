import { API_BASE } from './useApi'
import { useEffect, useState } from 'react'

export type BBox = [number, number, number, number]

async function fetchProvinceBBox(provId?: number): Promise<BBox | null> {
    if (!provId) return null
    const u = new URL(`${API_BASE}/locations/province-bbox`)
    u.searchParams.set('prov_id', String(provId))
    const res = await fetch(u.toString(), { cache: 'no-store' })
    if (!res.ok) return null
    const j = await res.json()
    return j?.bbox || null
}

export function useProvinceBBox(provId?: number) {
    const [bbox, setBbox] = useState<BBox | null>(null)
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        let alive = true
        setLoading(true)
        fetchProvinceBBox(provId).then(b => { if (alive) setBbox(b) })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [provId])
    return { bbox, loading }
}
