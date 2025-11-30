// ...existing code...
"use client";

import { useMemo } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type { RambuIndexResponse, RambuRow } from "@/types/rambu";

interface UseRambuCrudOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    categoryId?: number;
    disasterTypeId?: number;
    prov_id?: number;
    city_id?: number;
    district_id?: number;
    subdistrict_id?: number;
    isSimulation?: number;
    satkerId?: number;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    "https://api-mrb.supplydata.id/api";

// Normalisasi queryKey agar stabil
function buildQueryKey(opts: UseRambuCrudOptions) {
    const {
        page = 1,
        pageSize = 20,
        search = "",
        status = "",
        categoryId,
        disasterTypeId,
        prov_id,
        city_id,
        district_id,
        subdistrict_id,
        isSimulation,
    } = opts;

    // Ambil auth untuk role & satker_id
    let role: number | null = null;
    let userSatkerId: number | null = null;
    let token: string | null = null;
    let userId: number | null = null;

    if (typeof window !== 'undefined') {
        try {
            const authRaw = localStorage.getItem('auth');
            if (authRaw) {
                const parsed = JSON.parse(authRaw);
                token = parsed?.token ?? null;
                userId = parsed?.id ?? parsed?.userId ?? null;
                role = parsed?.role != null ? Number(parsed.role) : null;
                userSatkerId = parsed?.satker_id != null ? Number(parsed.satker_id) : null;
            }
        } catch { /* ignore */ }
    }

    return [
        "rambu-list",
        {
            page,
            pageSize,
            search,
            status,
            categoryId: categoryId ?? null,
            disasterTypeId: disasterTypeId ?? null,
            prov_id: prov_id ?? null,
            city_id: city_id ?? null,
            district_id: district_id ?? null,
            subdistrict_id: subdistrict_id ?? null,
            isSimulation: isSimulation ?? null,
            token: token ?? null,
            userId: userId ?? null,
        },
    ] as const;
}

async function fetchRambuList(opts: UseRambuCrudOptions) {
    const {
        page = 1,
        pageSize = 20,
        search,
        status,
        categoryId,
        disasterTypeId,
        prov_id,
        city_id,
        district_id,
        subdistrict_id,
        isSimulation,
    } = opts;

    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (categoryId != null) params.append("categoryId", String(categoryId));
    if (disasterTypeId != null) params.append("disasterTypeId", String(disasterTypeId));
    if (prov_id != null) params.append("prov_id", String(prov_id));
    if (city_id != null) params.append("city_id", String(city_id));
    if (district_id != null) params.append("district_id", String(district_id));
    if (subdistrict_id != null) params.append("subdistrict_id", String(subdistrict_id));
    if (isSimulation !== undefined) params.append("isSimulation", String(isSimulation));

    const auth = typeof window !== "undefined" ? localStorage.getItem("auth") : null;
    const token = auth ? JSON.parse(auth).token : null;

    const url = `${API_BASE}/api/rambu-crud?${params.toString()}`;
    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json: RambuIndexResponse = await res.json();
    const rows = Array.isArray(json.data) ? json.data : []
    const normalized = rows.map((r: any) => {
        const rawSim =
            (Array.isArray(r.RambuProps) ? r.RambuProps[0]?.isSimulation : r.RambuProps?.isSimulation) ??
            r.isSimulation ?? 0
        const isSimulation =
            rawSim === true ? 1 : rawSim === '1' ? 1 : rawSim === 'true' ? 1 : Number(rawSim) === 1 ? 1 : 0
        return { ...r, isSimulation }
    })
    return { data: normalized, total: Number(json.total ?? 0) }
    // return {
    //     data: Array.isArray(json.data) ? (json.data as RambuRow[]) : [],
    //     total: Number(json.total ?? 0),
    // };
}

export function useRambuCrud(
    options: UseRambuCrudOptions = {},
    queryOptions?: Omit<
        UseQueryOptions<{ data: RambuRow[]; total: number }, Error, { data: RambuRow[]; total: number }>,
        "queryKey" | "queryFn"
    >
) {
    const key = useMemo(() => buildQueryKey(options), [options]);

    const q = useQuery({
        queryKey: key,
        queryFn: () => fetchRambuList(options),
        placeholderData: (prev) => prev as { data: RambuRow[]; total: number } | undefined,
        staleTime: 30_000, // data dianggap fresh selama 30s
        gcTime: 5 * 60_000, // garbage collect 5 menit
        retry: 1,
        ...queryOptions,
    });

    return {
        data: q.data?.data ?? [],
        total: q.data?.total ?? 0,
        loading: q.isLoading,
        error: q.error ? (q.error.message || "Gagal memuat data") : null,
        queryKey: key, // berguna untuk invalidateQueries dari komponen lain
    };
}