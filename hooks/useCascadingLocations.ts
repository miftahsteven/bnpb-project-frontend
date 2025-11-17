'use client'
import { useFetch } from './useFetch'
import { apiGet } from '@/lib/api'

export type LocOption = { id: number; name: string }

export function useProvinces(q?: string, limit = 100) {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (limit) qs.set('limit', String(limit))
    const url = `/api/locations/provinces?${qs.toString()}`
    const key = `provinces:${q ?? ''}:${limit}`

    return useFetch<LocOption[]>(key, () => apiGet(url))
}

export function useCities(provId?: number, q?: string, limit = 200) {
    const enabled = typeof provId === 'number' && !Number.isNaN(provId)
    const qs = new URLSearchParams()
    if (enabled) qs.set('prov_id', String(provId))
    if (q) qs.set('q', q)
    if (limit) qs.set('limit', String(limit))
    const url = enabled ? `/api/locations/cities?${qs.toString()}` : ''
    const key = `cities:${enabled ? provId : 'none'}:${q ?? ''}:${limit}`

    return useFetch<LocOption[]>(key, () => enabled ? apiGet(url) : Promise.resolve([]))
}

export function useDistricts(cityId?: number, q?: string, limit = 300) {
    const enabled = typeof cityId === 'number' && !Number.isNaN(cityId)
    const qs = new URLSearchParams()
    if (enabled) qs.set('city_id', String(cityId))
    if (q) qs.set('q', q)
    if (limit) qs.set('limit', String(limit))
    const url = enabled ? `/api/locations/districts?${qs.toString()}` : ''
    const key = `districts:${enabled ? cityId : 'none'}:${q ?? ''}:${limit}`

    return useFetch<LocOption[]>(key, () => enabled ? apiGet(url) : Promise.resolve([]))
}

export function useSubdistricts(districtId?: number, q?: string, limit = 500) {
    const enabled = typeof districtId === 'number' && !Number.isNaN(districtId)
    const qs = new URLSearchParams()
    if (enabled) qs.set('district_id', String(districtId))
    if (q) qs.set('q', q)
    if (limit) qs.set('limit', String(limit))
    const url = enabled ? `/api/locations/subdistricts?${qs.toString()}` : ''
    const key = `subdistricts:${enabled ? districtId : 'none'}:${q ?? ''}:${limit}`

    return useFetch<LocOption[]>(key, () => enabled ? apiGet(url) : Promise.resolve([]))
}
