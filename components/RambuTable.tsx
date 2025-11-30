"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Eye, Pencil, Trash2, Plus, X, Map, Filter, RefreshCw } from "lucide-react";
import { useRambuCrud } from "@/hooks/useRambuCrud";
import RambuEditForm from './forms/RambuEditForm'
import { useQueryClient } from '@tanstack/react-query'
import StatusModal from './forms/StatusModal'
import RambuDetail from './forms/RambuDetail'
import RambuMapDetail from "./RambuMapDetail";
import RambuFilter from "./forms/RambuFilter";


type QueryState = {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    categoryId?: number;
    disasterTypeId?: number;
    prov_id?: number;
    city_id?: number;
    district_id?: number;
    subdistrict_id?: number;
    isSimulation?: number;
};

function fmtDate(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

export default function RambuTable() {
    // ---- query & data ----
    const [query, setQuery] = useState<QueryState>({ page: 1, pageSize: 10 });
    const { data, total, loading } = useRambuCrud(query);
    const [editOpen, setEditOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const queryClient = useQueryClient()
    const [statusOpen, setStatusOpen] = useState(false)
    const [statusTarget, setStatusTarget] = useState<any | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailTarget, setDetailTarget] = useState<any | null>(null)
    const [detailMapOpen, setDetailMapOpen] = useState(false)
    const [detailMapTarget, setDetailMapTarget] = useState<any | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined


    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / (query.pageSize || 20))),
        [total, query.pageSize]
    );

    function onClickStatus(row: any) {
        setStatusTarget(row)
        setStatusOpen(true)
    }

    function resetFilters() {
        setQuery(prev => ({
            page: 1,
            pageSize: prev.pageSize,
            search: undefined,
            status: undefined,
            categoryId: undefined,
            disasterTypeId: undefined,
            prov_id: undefined,
            city_id: undefined,
            district_id: undefined,
            subdistrict_id: undefined,
            isSimulation: undefined,
        }))
        queryClient.invalidateQueries({ queryKey: ['rambu-list'] })
    }

    // ---- modal add (pakai form page yang sudah ada) ----
    const [openModal, setOpenModal] = useState(false);

    // keep halaman valid
    useEffect(() => {
        if (query.page > totalPages) {
            setQuery((q) => ({ ...q, page: totalPages }));
        }
    }, [totalPages, query.page]);

    function onClickEdit(row: any) {
        setEditing(row)
        setEditOpen(true)
    }

    function onClickDetailMap(row: any) {
        setDetailMapTarget(row)
        setDetailMapOpen(true)
    }

    function onClickFilter() {
        setFilterOpen((o) => !o)
    }

    // ---- actions ----
    const onDelete = async (id: number) => {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const ok = confirm("Yakin hapus rambu ini?");
        if (!ok) return;
        try {
            const auth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null
            const token = auth ? JSON.parse(auth).token : null
            const res = await fetch(`${base}/api/rambu/${id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) throw new Error(`Gagal hapus (HTTP ${res.status})`);
            // refresh tabel dan bump state query agar fetch ulang
            // refreshList() saat delete berhasil
            await queryClient.invalidateQueries({ queryKey: ['rambu-list'] })
            // jika mau, tutup modal edit jika sedang terbuka
            setEditOpen(false)
            setEditing(null)
            // setQuery((q) => ({ ...q }));
        } catch (e: any) {
            alert(e?.message || "Gagal menghapus data");
        }
    };

    const refreshList = useCallback(() => {
        // Jika pakai SWR/React Query, panggil mutate/refetch di sini.
        // Jika fetch manual tergantung query, bump state agar effect fetch jalan.
        setQuery(q => ({ ...q }))
    }, [])

    useEffect(() => {
        function onRefresh() {
            refreshList()
            // jika modal edit masih terbuka, tutup
            setEditOpen(false)
            setEditing(null)
        }
        window.addEventListener('rambu:refresh', onRefresh)
        return () => window.removeEventListener('rambu:refresh', onRefresh)
    }, [refreshList])

    function onClickDetail(row: any) {
        setDetailTarget(row)
        setDetailOpen(true)
    }

    return (
        <>
            <div className="h-full w-full flex flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-800">Data Rambu</h2>
                        <span className="text-xs text-slate-500">({total} entri)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* buatkan reset button */}
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                            title="Reset filter"
                        >
                            <RefreshCw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={onClickFilter}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                            title="Filter Rambu"
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                        <input
                            type="text"
                            placeholder="Cari nama / deskripsi…"
                            className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200"
                            value={query.search || ""}
                            onChange={(e) =>
                                setQuery((q) => ({ ...q, page: 1, search: e.target.value }))
                            }
                        />
                        <button
                            onClick={() => setOpenModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-3 py-2 text-sm hover:bg-blue-800"
                            title="Tambah Rambu"
                        >
                            <Plus size={16} />
                            Tambah Rambu
                        </button>
                    </div>
                </div>

                {/* Card wrapper */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Tabel */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 text-[13px] uppercase tracking-wide">
                                    <th className="text-left px-4 py-3 border-b">No</th>
                                    <th className="text-left px-4 py-3 border-b">Nama & Deskripsi</th>
                                    {/* <th className="text-left px-4 py-3 border-b">Kategori</th> */}
                                    <th className="text-left px-4 py-3 border-b">Tipe Bencana</th>
                                    <th className="text-left px-4 py-3 border-b">Provinsi</th>
                                    <th className="text-left px-4 py-3 border-b">Kota/Kab.</th>
                                    <th className="text-left px-4 py-3 border-b">Kec.</th>
                                    <th className="text-left px-4 py-3 border-b">Status</th>
                                    <th className="text-left px-4 py-3 border-b">Dibuat</th>
                                    <th className="text-right px-4 py-3 border-b">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                            Memuat data…
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                            Tidak ada data.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                        <tr
                                            key={row.id}
                                            className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                        >
                                            {/* Nama & deskripsi (alamat) sebagai subtitle */}
                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {(query.page - 1) * query.pageSize + idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-slate-800">{row.categoryName}</div>
                                                <div className="text-[12px] text-slate-500 mt-1 line-clamp-2">
                                                    {row.description || "-"}
                                                </div>
                                            </td>

                                            {/* <td className="px-4 py-3 align-top">
                                            <span className="text-sm text-slate-700">
                                                {row.categoryName || "-"}
                                            </span>
                                        </td> */}

                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {row.disasterTypeName || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {row.provinceName || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {row.cityName || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {row.districtName || "-"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <button
                                                    onClick={() => onClickStatus(row)}
                                                    className={[
                                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                                        // jika isSimulation true warnanya merah muda, jika status published hijau, jika draft abu-abu
                                                        (row as any)?.isSimulation
                                                            ? "bg-purple-400 text-white"
                                                            : row.status === "published"
                                                                ? "bg-green-600 text-white"
                                                                : row.status === "broken"
                                                                    ? "bg-red-500 text-white"
                                                                    : "bg-black text-white",
                                                    ].join(" ")}
                                                >
                                                    {/* tambahkan isSimulation jika mmg simulasi, jika bukan dia buka stats */}
                                                    {(row as any)?.isSimulation ? 'Simulasi' : row.status === "published" ? 'Published' : row.status === "draft" ? 'Draft' : 'Broken'}
                                                </button>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <span className="text-sm text-slate-700">
                                                    {fmtDate(row.createdAt)}
                                                </span>
                                            </td>

                                            {/* Aksi: hanya ICON */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center justify-end gap-2 text-slate-600">
                                                    {/* tombol eye ke detail */}
                                                    <button
                                                        onClick={() => onClickDetail(row)}
                                                        title="Detail"
                                                        className="p-1.5 rounded hover:bg-slate-200"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onClickEdit(row)}
                                                        title="Sunting"
                                                        className="p-1.5 rounded hover:bg-slate-200 text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(row.id)}
                                                        title="Hapus"
                                                        className="p-1.5 rounded hover:bg-slate-200 text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onClickDetailMap(row)}
                                                        title="Lihat di Peta"
                                                        className="p-1.5 rounded hover:bg-slate-200"
                                                    >
                                                        <Map size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer: pagination & page size */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                        <div className="text-sm text-slate-600">
                            Halaman {query.page} dari {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-600">Baris/halaman</label>
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={query.pageSize}
                                onChange={(e) =>
                                    setQuery((q) => ({ ...q, page: 1, pageSize: Number(e.target.value) }))
                                }
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center gap-1">
                                <button
                                    className="border rounded px-2 py-1 text-sm disabled:opacity-40"
                                    onClick={() => setQuery((q) => ({ ...q, page: 1 }))}
                                    disabled={query.page <= 1}
                                >
                                    «
                                </button>
                                <button
                                    className="border rounded px-2 py-1 text-sm disabled:opacity-40"
                                    onClick={() =>
                                        setQuery((q) => ({ ...q, page: Math.max(1, q.page - 1) }))
                                    }
                                    disabled={query.page <= 1}
                                >
                                    ‹
                                </button>
                                <button
                                    className="border rounded px-2 py-1 text-sm disabled:opacity-40"
                                    onClick={() =>
                                        setQuery((q) => ({ ...q, page: Math.min(totalPages, q.page + 1) }))
                                    }
                                    disabled={query.page >= totalPages}
                                >
                                    ›
                                </button>
                                <button
                                    className="border rounded px-2 py-1 text-sm disabled:opacity-40"
                                    onClick={() => setQuery((q) => ({ ...q, page: totalPages }))}
                                    disabled={query.page >= totalPages}
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {editOpen && (
                    <RambuEditForm
                        open={editOpen}
                        rambu={editing}
                        onClose={() => { setEditOpen(false); setEditing(null) }}
                        onUpdated={() => {
                            // refresh tabel dan tutup modal walau event tidak tertangkap
                            //refreshList()
                            queryClient.invalidateQueries({ queryKey: ['rambu-list'] })
                            setEditOpen(false)
                            setEditing(null)
                        }}
                        token={token}
                    />
                )}

                {/* Modal Tambah Rambu (iframe ke halaman form yang sudah ada) */}
                {openModal && (
                    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <h3 className="text-base font-semibold text-slate-800">Tambah Rambu</h3>
                                <button
                                    onClick={() => setOpenModal(false)}
                                    className="p-2 rounded hover:bg-slate-100"
                                    aria-label="Tutup"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-0 max-h-[100vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                <iframe
                                    src="/rambu-form-only"
                                    className="w-full h-[90vh]"
                                    title="Form Rambu"
                                />
                            </div>
                        </div>
                    </div>
                )}
                {statusOpen && statusTarget && (
                    <StatusModal
                        open={statusOpen}
                        row={statusTarget}
                        onClose={() => { setStatusOpen(false); setStatusTarget(null) }}
                        onUpdated={async () => {
                            await queryClient.invalidateQueries({ queryKey: ['rambu-list'] })
                            setStatusOpen(false)
                            setStatusTarget(null)
                        }}
                    />
                )}
                {detailOpen && detailTarget && (
                    <RambuDetail
                        open={detailOpen}
                        id={detailTarget.id}
                        onClose={() => { setDetailOpen(false); setDetailTarget(null) }}
                    />
                )}
                {detailMapOpen && detailMapTarget && (
                    <RambuMapDetail
                        open={detailMapOpen}
                        id={detailMapTarget.id}
                        onClose={() => { setDetailMapOpen(false); setDetailMapTarget(null) }}
                    />
                )}
                {filterOpen && (
                    <RambuFilter
                        open={filterOpen}
                        query={query}
                        onClose={() => setFilterOpen(false)}
                        onApply={(newFilters) => {
                            setQuery((q) => ({
                                ...q,
                                ...newFilters,
                                page: 1, // reset ke halaman 1 saat filter diterapkan
                            }));
                            setFilterOpen(true);
                        }}
                    />
                )}
            </div>
        </>
    );
}
