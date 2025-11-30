'use client'

import { useFetch } from './useFetch'
import { apiGet } from '@/lib/api'

type Option = { id: number; name: string }

export function useCategories() {
    return useFetch<Option[]>('/ref/categories', () => apiGet('/api/ref/categories'))
}
export function useDisasterTypes() {
    return useFetch<Option[]>('/ref/disaster-types', () => apiGet('/api/ref/disaster-types'))
}
export function useModels() {
    return useFetch<Option[]>('/ref/model', () => apiGet('/api/ref/model'))
}
export function useCostSources() {
    return useFetch<Option[]>('/ref/costsource', () => apiGet('/api/ref/costsource'))
}

export function useSatuanKerja() {
    return useFetch<Option[]>('/users/satuan-kerja', () => apiGet('/api/users/satuan-kerja'))
}
