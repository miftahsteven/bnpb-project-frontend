// app/api/rambu/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "http://localhost:4000/api/rambu";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page") ?? "1");
        const pageSize = Number(searchParams.get("pageSize") ?? "20");
        const q = searchParams.get("q") ?? "";
        const provinceId = searchParams.get("provinceId") ?? "";

        // ✅ backend hanya punya prov_id
        const url = new URL(BASE_URL);
        if (provinceId) url.searchParams.set("prov_id", provinceId);
        if (q) url.searchParams.set("q", q);

        const res = await fetch(url.toString(), { cache: "no-store" });

        if (!res.ok) {
            return NextResponse.json({ data: [], total: 0 });
        }

        const json = await res.json();

        // ✅ Normalize response
        const all = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        const total = all.length;

        // ✅ Pagination manual (di sisi Next.js)
        const start = (page - 1) * pageSize;
        const paginated = all.slice(start, start + pageSize);

        return NextResponse.json({
            data: paginated,
            total: total,
        });
    } catch (err) {
        console.error("API ERROR", err);
        return NextResponse.json({ data: [], total: 0 }, { status: 500 });
    }
}
