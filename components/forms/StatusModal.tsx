import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
    open: boolean
    row: any
    onClose: () => void
    onUpdated: () => void
}

export default function StatusModal({ open, row, onClose, onUpdated }: Props) {
    const qc = useQueryClient()
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const initial =
        (row as any)?.isSimulation ? 'simulation' :
            row.status === 'published' ? 'published' :
                row.status === 'draft' ? 'draft' :
                    'broken'
    const [status, setStatus] = useState<string>(initial)

    async function handleSave() {
        setErr(null); setSaving(true)
        try {
            const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
            const auth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null
            const token = auth ? JSON.parse(auth).token : null
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }

            // 1) Update status via /rambu-status/:id
            const u = `${base}/api/rambu-status/${row.id}`
            const statusBody = {
                status: status === 'simulation' ? 'draft' : status,
            }
            const res = await fetch(u, { method: 'PUT', headers, body: JSON.stringify(statusBody) })
            if (!res.ok) {
                const t = await res.text().catch(() => '')
                throw new Error(t || `Gagal update status (${res.status})`)
            }

            // 2) Update flag simulasi via PATCH /rambu/:id
            const patchBody =
                status === 'simulation'
                    ? { isSimulation: 1 }
                    : { isSimulation: 0 }
            const res2 = await fetch(`${base}/api/rambu/${row.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(patchBody),
            })
            if (!res2.ok) {
                const t = await res2.text().catch(() => '')
                throw new Error(t || `Gagal update simulasi (${res2.status})`)
            }

            await qc.invalidateQueries({ queryKey: ['rambu-list'] })
            onUpdated()
        } catch (e: any) {
            setErr(e?.message || 'Gagal menyimpan status')
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null
    return (
        <div className="fixed inset-0 z-[2100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-base font-semibold text-slate-800">Ubah Status Rambu #{row.id}</h3>
                    <button onClick={onClose} className="p-2 rounded hover:bg-slate-100" aria-label="Tutup">✕</button>
                </div>
                <div className="p-4 space-y-3 text-sm">
                    <label className="block">
                        <span className="block text-xs mb-1">Status</span>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        >
                            <option value="simulation">Simulasi</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="broken">Broken</option>
                        </select>
                    </label>
                    {err && <div className="text-xs text-red-600">{err}</div>}
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
                    <button onClick={onClose} className="px-3 py-1.5 rounded border">Batal</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
                    >
                        {saving ? 'Menyimpan…' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    )
}