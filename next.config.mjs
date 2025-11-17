/** @type {import('next').NextConfig} */
const nextConfig = {
    // ✅ PAKSA WEBPACK, MATIKAN TURBOPACK
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:4000"]
        },
    },

    webpack(config) {
        config.externals = [...(config.externals || []), "maplibre-gl"];
        return config;
    },

    // ✅ TRIK WAJIB AGAR CSS MAPLIBRE BISA DIIMPORT
    transpilePackages: ["maplibre-gl"],

    // ✅ Nonaktifkan turbopack sepenuhnya
    turbopack: false,
};

export default nextConfig;
