'use client'

export default function FileInput({
    label, name, required
}: { label: string; name: string; required?: boolean }) {
    return (
        <label className="block">
            <span className="block text-sm mb-1">{label}</span>
            <input
                type="file"
                name={name}
                accept="image/*"
                required={required}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#004AAD] file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
            />
        </label>
    )
}
