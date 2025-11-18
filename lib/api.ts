export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://api-mrb.suppydata.id';

type Json = any;

export async function apiGet<T>(path: string) {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<T>
}


export async function publicGet<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/** PRIVATE fetch — dengan bearer */
export async function privateGet<T = any>(
    path: string,
    bearerFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): Promise<T> {
    const res = await bearerFetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/** PRIVATE write operation */
export async function privatePost<T = any>(
    path: string,
    body: any,
    bearerFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): Promise<T> {
    const res = await bearerFetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function apiPostForm<T>(path: string, form: FormData) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<T>
}

export async function getJSON<T = Json>(
    path: string,
    signal?: AbortSignal
): Promise<T> {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, { signal, credentials: 'omit' });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GET ${url} ${res.status} ${text || res.statusText}`);
    }
    return res.json();
}
