export function toFormData(obj: Record<string, any>) {
    const fd = new FormData()
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        if (v instanceof File) fd.append(k, v)
        else fd.append(k, String(v))
    })
    return fd
}
