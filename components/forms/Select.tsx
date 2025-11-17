'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Select({
    label, children, error, loading, placeholder, className, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string
    error?: string
    loading?: boolean
    placeholder?: string
    children?: ReactNode
}) {
    return (
        <label className="block">
            {label && <span className="block text-sm mb-1">{label}</span>}
            <select
                className={clsx(
                    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004AAD] disabled:bg-gray-100",
                    className
                )}
                {...rest}
            >
                <option value="">{loading ? 'Memuat…' : (placeholder ?? '— pilih —')}</option>
                {children}
            </select>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </label>
    )
}
