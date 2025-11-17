// /components/RambuFilters.tsx
'use client';

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useProvinces } from "@/hooks/useCascadingLocations";

type Props = {
    onApply: (filters: {
        search?: string;
        categoryId?: number;
        disasterTypeId?: number;
        prov_id?: number;
        city_id?: number;
        status?: string;
    }) => void;
    loading?: boolean;
};

export default function RambuFilters({ onApply, loading }: Props) {
    const { data: provinces } = useProvinces();
    const [search, setSearch] = useState("");
    const [prov, setProv] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [disasterTypeId, setDisasterTypeId] = useState<string>("");

    // NOTE: jika kamu punya hooks ref kategori & disasterType silakan ganti:
    const categories = useMemo(() => ([
        { id: 1, name: "Kategori A" },
        { id: 2, name: "Kategori B" },
    ]), []);
    const disasterTypes = useMemo(() => ([
        { id: 1, name: "Bencana 1" },
        { id: 2, name: "Bencana 2" },
        { id: 3, name: "Bencana 3" },
        { id: 4, name: "Bencana 4" },
    ]), []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Cari</label>
                <div className="relative">
                    <input
                        className="w-full border rounded-lg px-3 py-2 pr-9"
                        placeholder="Nama/Deskripsi…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search size={16} className="absolute right-2 top-2.5 text-gray-500" />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-600">Provinsi</label>
                <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={prov}
                    onChange={(e) => setProv(e.target.value)}
                >
                    <option value="">Semua</option>
                    {provinces?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-600">Kategori</label>
                <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    <option value="">Semua</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-600">Tipe Bencana</label>
                <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={disasterTypeId}
                    onChange={(e) => setDisasterTypeId(e.target.value)}
                >
                    <option value="">Semua</option>
                    {disasterTypes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-600">Status</label>
                <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">Semua</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>

            <div className="md:col-span-6 flex gap-2">
                <button
                    onClick={() => onApply({
                        search: search || undefined,
                        prov_id: prov ? Number(prov) : undefined,
                        categoryId: categoryId ? Number(categoryId) : undefined,
                        disasterTypeId: disasterTypeId ? Number(disasterTypeId) : undefined,
                        status: status || undefined,
                    })}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-[#004AAD] text-white hover:opacity-95 disabled:opacity-60"
                >
                    Terapkan
                </button>
                <button
                    onClick={() => {
                        setSearch(""); setProv(""); setStatus(""); setCategoryId(""); setDisasterTypeId("");
                        onApply({});
                    }}
                    className="px-4 py-2 rounded-lg border"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
