// hooks/_fetcher.ts
export const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || 'https://api-mrb.suppydata.id';

export async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${API_BASE}${path}${sep}t=${Date.now()}`; // bust cache
    const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GET ${path} ${res.status} ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
}
