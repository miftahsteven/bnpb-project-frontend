'use client'

import { useEffect, useState } from 'react'

export function useFetch<T>(key: string, fetcher: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<null | string>(null)

    useEffect(() => {
        let active = true
        setLoading(true)
        fetcher()
            .then(d => { if (active) { setData(d); setError(null) } })
            .catch(e => active && setError(e?.message ?? 'Error'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [key])

    return { data, loading, error }
}
