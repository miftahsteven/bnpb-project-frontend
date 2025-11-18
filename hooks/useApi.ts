export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api-mrb.suppydata.id';

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, cache: 'no-store' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
}
