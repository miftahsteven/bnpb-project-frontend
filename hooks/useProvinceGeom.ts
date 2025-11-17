// /app/hooks/useProvinceGeom.ts
import { useEffect, useRef, useState } from 'react'

type GeomData = any

// Gunakan ENV agar fleksibel jika nanti backend pindah server
const BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:4000/api' // default backend kamu

export function useProvinceGeom(provId?: number, dep?: number) {
    const [data, setData] = useState<GeomData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        // reset state setiap provId berubah
        setData(null)
        setError(null)

        // jika tidak ada provinsi → clear
        if (!provId) {
            return
        }

        // abort request sebelumnya
        const ac = new AbortController()
        abortRef.current?.abort()
        abortRef.current = ac

            ; (async () => {
                try {
                    setLoading(true)

                    // 🔥 URL backend kamu yang benar:
                    const url = `${BASE_URL}/locations/province-geojson?prov_id=${provId}`

                    const res = await fetch(url, {
                        signal: ac.signal,
                        headers: { 'cache-control': 'no-cache' },
                    })

                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`)
                    }

                    const text = await res.text()

                    // beberapa response kadang string, kadang JSON
                    const json = (() => {
                        try {
                            return JSON.parse(text)
                        } catch {
                            return text
                        }
                    })()

                    if (!ac.signal.aborted) {
                        setData(json)
                    }
                } catch (err: any) {
                    if (!ac.signal.aborted) {
                        setError(String(err?.message || err))
                    }
                } finally {
                    if (!ac.signal.aborted) {
                        setLoading(false)
                    }
                }
            })()

        return () => ac.abort()

        // dep: kunci eksternal untuk memaksa re-fetch
    }, [provId, dep])

    return { data, loading, error }
}
