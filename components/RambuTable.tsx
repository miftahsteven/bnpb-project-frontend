"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, X } from "lucide-react";
import { useRambuCrud } from "@/hooks/useRambuCrud";

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
    const [query, setQuery] = useState<QueryState>({ page: 1, pageSize: 20 });
    const { data, total, loading } = useRambuCrud(query);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / (query.pageSize || 20))),
        [total, query.pageSize]
    );

    // ---- modal add (pakai form page yang sudah ada) ----
    const [openModal, setOpenModal] = useState(false);

    // keep halaman valid
    useEffect(() => {
        if (query.page > totalPages) {
            setQuery((q) => ({ ...q, page: totalPages }));
        }
    }, [totalPages, query.page]);

    // ---- actions ----
    const onDelete = async (id: number) => {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const ok = confirm("Yakin hapus rambu ini?");
        if (!ok) return;
        try {
            const res = await fetch(`${base}/api/rambu/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Gagal hapus (HTTP ${res.status})`);
            // refresh
            setQuery((q) => ({ ...q }));
        } catch (e: any) {
            alert(e?.message || "Gagal menghapus data");
        }
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">Data Rambu</h2>
                    <span className="text-xs text-slate-500">({total} entri)</span>
                </div>

                <div className="flex items-center gap-2">
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
                                data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors"
                                    >
                                        {/* Nama & deskripsi (alamat) sebagai subtitle */}
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
                                            <span
                                                className={[
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                                    row.status === "published"
                                                        ? "bg-green-100 text-green-700"
                                                        : row.status === "draft"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-700",
                                                ].join(" ")}
                                            >
                                                {row.status || "-"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <span className="text-sm text-slate-700">
                                                {fmtDate(row.createdAt)}
                                            </span>
                                        </td>

                                        {/* Aksi: hanya ICON */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center justify-end gap-2 text-slate-600">
                                                <a
                                                    href={`/rambu/${row.id}`}
                                                    title="Detail"
                                                    className="p-1.5 rounded hover:bg-slate-200"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                                <a
                                                    href={`/rambu/${row.id}/edit`}
                                                    title="Edit"
                                                    className="p-1.5 rounded hover:bg-slate-200"
                                                >
                                                    <Pencil size={16} />
                                                </a>
                                                <button
                                                    onClick={() => onDelete(row.id)}
                                                    title="Hapus"
                                                    className="p-1.5 rounded hover:bg-slate-200 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
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
        </div>
    );
}
