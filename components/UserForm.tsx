"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSatuanKerja } from "@/hooks/useOptions";

type UserItem = {
    id: number;
    username: string | null;
    name: string | null;
    role: number;
    satker_id: number | null;
    status: number;
};

type SatkerItem = {
    id: number;
    name: string | null;
};

export default function UserForm({
    onClose,
    onSuccess,
    editItem,
}: {
    onClose: () => void;
    onSuccess: () => void;
    editItem: UserItem | null;
}) {
    const { token } = useAuth();

    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(editItem?.name ?? "");
    const [username, setUsername] = useState(editItem?.username ?? "");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(editItem?.role ?? 2);
    const [satker, setSatker] = useState<number | null>(editItem?.satker_id ?? null);
    const [status, setStatus] = useState(editItem?.status ?? 1);

    const [satkerList, setSatkerList] = useState<SatkerItem[]>([]);

    const { data: satuanKerjaList, loading: loadingCat } = useSatuanKerja();

    async function loadSatker() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/satker/list`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSatkerList(satuanKerjaList || []);
    }

    useEffect(() => {
        loadSatker();
    }, []);

    async function submit() {
        if (!username || (!editItem && !password)) {
            alert("Username dan password harus diisi");
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name,
                username,
                role: Number(role),
                satker_id: satker ? Number(satker) : null,
                status: Number(status),
            };

            if (password) {
                payload.password = password;
            }

            const url = editItem
                ? `${process.env.NEXT_PUBLIC_API_URL}/users/${editItem.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/users`;

            const method = editItem ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error(err);
                alert("Gagal menyimpan data");
                return;
            }

            onSuccess();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded shadow-lg p-6">
                <h1 className="text-xl font-semibold mb-4">
                    {editItem ? "Edit User" : "Tambah User"}
                </h1>

                {/* Nama */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nama</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Nama lengkap"
                    />
                </div>

                {/* Username */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Username"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        {editItem ? "Password (opsional)" : "Password"}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder={
                            editItem ? "Kosongkan jika tidak ingin mengubah" : "Password baru"
                        }
                    />
                </div>

                {/* Role */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value={1}>Superadmin</option>
                        <option value={2}>Admin</option>
                        <option value={3}>Manager</option>
                    </select>
                </div>

                {/* Satker */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Satuan Kerja</label>
                    <select
                        value={satker ?? ""}
                        onChange={(e) => setSatker(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="">-- Pilih --</option>
                        {satuanKerjaList?.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value={1}>Aktif</option>
                        <option value={0}>Nonaktif</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Batal
                    </button>

                    <button
                        onClick={submit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
