// /lib/http.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export function qs(params: Record<string, any>) {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        s.append(k, String(v));
    });
    const txt = s.toString();
    return txt ? `?${txt}` : '';
}

export async function getJSON<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}${qs(params)}`, { cache: 'no-store' });
    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`GET ${path} ${res.status}: ${msg}`);
    }
    return res.json() as Promise<T>;
}
