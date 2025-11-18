"use client";
import { useEffect, useState } from "react";
import UserForm from "@/components/UserForm";
import { useAuth } from "@/hooks/useAuth";

type UserItem = {
    id: number;
    username: string | null;
    name: string | null;
    role: number;
    satker_id: number | null;
    status: number;
    satuanKerja?: {
        id: number;
        name: string | null;
        prov_id: number | null;
        citiy_id: number | null;
    } | null;
};

export default function UsersTable() {
    const { token, logout } = useAuth();

    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);

    const [openForm, setOpenForm] = useState(false);
    const [editItem, setEditItem] = useState<UserItem | null>(null);

    const [detailItem, setDetailItem] = useState<UserItem | null>(null);

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://api-mrb.suppydata.id";

    async function load() {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/users?page=${page}&limit=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error("Fetch users failed:", res.status, text);
                // if (res.status === 401) return logout();
                return;
            }

            const data = await res.json();
            console.log("Fetched users:", data);

            const isArray = Array.isArray(data);
            const items: UserItem[] = isArray ? data : (data?.items ?? []);
            const totalCount =
                isArray
                    ? Number(res.headers.get("x-total-count") ?? items.length)
                    : Number(data?.total ?? items.length);

            setUsers(items);
            setTotal(totalCount);
        } catch (e) {
            console.error("Load users error:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [page]);

    function roleName(role: number) {
        if (role === 1) return "Superadmin";
        if (role === 2) return "Admin";
        return "Manager";
    }

    async function toggleStatus(id: number, current: number) {
        const newStatus = current === 1 ? 0 : 1;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
        });

        load();
    }

    async function resetPassword(id: number) {
        const pwd = prompt("Masukkan password baru:");
        if (!pwd) return;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ password: pwd }),
        });

        alert("Password berhasil direset");
    }

    async function deleteUser(id: number) {
        if (!confirm("Yakin ingin menghapus user ini?")) return;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        load();
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">User Management</h1>

                <button
                    onClick={() => {
                        setEditItem(null);
                        setOpenForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    + Tambah User
                </button>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full table-auto text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Nama</th>
                            <th className="p-3 text-left">Username</th>
                            <th className="p-3 text-left">Role</th>
                            <th className="p-3 text-left">Satker</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left w-40">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : users?.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            users?.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="p-3">{u.name}</td>
                                    <td className="p-3">{u.username}</td>

                                    <td className="p-3">
                                        <span className="px-2 py-1 text-white bg-red-700 rounded text-xs">
                                            {roleName(u.role)}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        {u.satuanKerja?.name || "-"}
                                    </td>

                                    <td className="p-3">
                                        {u.status === 1 ? (
                                            <span className="text-green-600 font-semibold">Aktif</span>
                                        ) : (
                                            <span className="text-gray-500">Nonaktif</span>
                                        )}
                                    </td>

                                    <td className="p-3 space-x-1">
                                        <button
                                            onClick={() => setDetailItem(u)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Detail
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEditItem(u);
                                                setOpenForm(true);
                                            }}
                                            className="text-yellow-600 hover:underline"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => deleteUser(u.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>

                                        <button
                                            onClick={() => resetPassword(u.id)}
                                            className="text-purple-600 hover:underline"
                                        >
                                            Reset Password
                                        </button>

                                        <button
                                            onClick={() => toggleStatus(u.id, u.status)}
                                            className="text-gray-700 hover:underline"
                                        >
                                            {u.status === 1 ? "Nonaktifkan" : "Aktifkan"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                >
                    Prev
                </button>

                <span>
                    Page {page} / {Math.ceil(total / pageSize)}
                </span>

                <button
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-2 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Form modal */}
            {openForm && (
                <UserForm
                    onClose={() => setOpenForm(false)}
                    onSuccess={() => {
                        setOpenForm(false);
                        load();
                    }}
                    editItem={editItem}
                />
            )}

            {/* Detail Modal */}
            {detailItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">Detail User</h2>

                        <p><strong>Nama:</strong> {detailItem.name}</p>
                        <p><strong>Username:</strong> {detailItem.username}</p>
                        <p><strong>Role:</strong> {roleName(detailItem.role)}</p>
                        <p><strong>Status:</strong> {detailItem.status === 1 ? "Aktif" : "Nonaktif"}</p>
                        <p><strong>Satker:</strong> {detailItem.satuanKerja?.name || "-"}</p>

                        <div className="text-right mt-4">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
