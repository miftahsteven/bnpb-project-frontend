// =======================
// TIPE DATA UNTUK CRUD RAMBU
// =======================

// Baris data tunggal pada Datatable
export interface RambuRow {
    id: number;
    name: string;
    description: string | null;
    status: string;
    createdAt: string;

    categoryName: string | null;
    disasterTypeName: string | null;
    provinceName: string | null;
    cityName: string | null;
    districtName: string | null;
    subdistrictName: string | null;
}

// Response GET /api/rambu-crud
export interface RambuIndexResponse {
    data: RambuRow[];
    total: number;
    page: number;
    pageSize: number;
}
