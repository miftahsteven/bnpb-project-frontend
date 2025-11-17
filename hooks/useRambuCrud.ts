"use client";

import { useState, useEffect } from "react";
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
}

export function useRambuCrud(options: UseRambuCrudOptions = {}) {
    const [data, setData] = useState<RambuRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ BASE URL dari ENV
    const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
        "http://localhost:4000/api"; // fallback aman

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
    } = options;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });

            if (search) params.append("search", search);
            if (status) params.append("status", status);
            if (categoryId) params.append("categoryId", String(categoryId));
            if (disasterTypeId) params.append("disasterTypeId", String(disasterTypeId));
            if (prov_id) params.append("prov_id", String(prov_id));
            if (city_id) params.append("city_id", String(city_id));
            if (district_id) params.append("district_id", String(district_id));
            if (subdistrict_id) params.append("subdistrict_id", String(subdistrict_id));

            const url = `${API_BASE}/api/rambu-crud?${params.toString()}`;

            try {
                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const json: RambuIndexResponse = await res.json();

                if (cancelled) return;

                setData(json.data || []);
                setTotal(json.total || 0);
            } catch (err: any) {
                if (!cancelled) {
                    setError(String(err.message || err));
                    setData([]);
                    setTotal(0);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [
        page,
        pageSize,
        search,
        status,
        categoryId,
        disasterTypeId,
        prov_id,
        city_id,
        district_id,
        subdistrict_id
    ]);

    return {
        data,
        total,
        loading,
        error,
    };
}
