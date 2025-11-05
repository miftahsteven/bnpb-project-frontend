(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/Drawer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Drawer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function Drawer({ children }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen((v)=>!v),
                className: "fixed top-3 left-3 z-[1000] rounded-full p-2 bg-white shadow hover:bg-gray-100",
                "aria-label": "Toggle menu",
                children: open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/components/Drawer.tsx",
                    lineNumber: 22,
                    columnNumber: 25
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/components/Drawer.tsx",
                    lineNumber: 22,
                    columnNumber: 43
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/Drawer.tsx",
                lineNumber: 17,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])('fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur border-r border-gray-200 shadow-lg z-[999] transition-transform', open ? 'translate-x-0' : '-translate-x-full'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-12"
                    }, void 0, false, {
                        fileName: "[project]/components/Drawer.tsx",
                        lineNumber: 32,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold",
                                children: "RambuBencana"
                            }, void 0, false, {
                                fileName: "[project]/components/Drawer.tsx",
                                lineNumber: 34,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                className: "space-y-1 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "block px-2 py-1 rounded hover:bg-gray-100",
                                        href: "#",
                                        children: "Dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/components/Drawer.tsx",
                                        lineNumber: 36,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "block px-2 py-1 rounded hover:bg-gray-100",
                                        href: "#",
                                        children: "Data Rambu"
                                    }, void 0, false, {
                                        fileName: "[project]/components/Drawer.tsx",
                                        lineNumber: 37,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "block px-2 py-1 rounded hover:bg-gray-100",
                                        href: "#",
                                        children: "Impor Excel"
                                    }, void 0, false, {
                                        fileName: "[project]/components/Drawer.tsx",
                                        lineNumber: 38,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "block px-2 py-1 rounded hover:bg-gray-100",
                                        href: "#",
                                        children: "Simulasi"
                                    }, void 0, false, {
                                        fileName: "[project]/components/Drawer.tsx",
                                        lineNumber: 39,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "block px-2 py-1 rounded hover:bg-gray-100",
                                        href: "#",
                                        children: "Peta Tsunami"
                                    }, void 0, false, {
                                        fileName: "[project]/components/Drawer.tsx",
                                        lineNumber: 40,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/Drawer.tsx",
                                lineNumber: 35,
                                columnNumber: 21
                            }, this),
                            children
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/Drawer.tsx",
                        lineNumber: 33,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Drawer.tsx",
                lineNumber: 26,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true);
}
_s(Drawer, "dVkDIfRb5RN4FjtonjBYYwpg89o=");
_c = Drawer;
var _c;
__turbopack_context__.k.register(_c, "Drawer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/FullMap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FullMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$maplibre$2d$gl$2f$dist$2f$maplibre$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/maplibre-gl/dist/maplibre-gl.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
// Koordinat batas Indonesia
const IDN_BOUNDS = [
    [
        94.97,
        -11.0
    ],
    [
        141.02,
        6.1
    ]
];
function FullMap() {
    _s();
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FullMap.useEffect": ()=>{
            if (!containerRef.current) return;
            // Inisialisasi MapLibre
            const map = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$maplibre$2d$gl$2f$dist$2f$maplibre$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Map({
                container: containerRef.current,
                style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
                center: [
                    117.5,
                    -2.5
                ],
                zoom: 4,
                attributionControl: false
            });
            mapRef.current = map;
            map.on('load', {
                "FullMap.useEffect": ()=>{
                    console.log('Peta berhasil dimuat!');
                    // 🔷 Warna brand MSCode
                    const brandBlue = '#A2BEDB';
                    const brandWhite = '#ffffff';
                    // Ubah warna dasar daratan
                    if (map.getLayer('land')) {
                        map.setPaintProperty('land', 'background-color', brandWhite);
                    }
                    // Ubah warna air (laut/sungai)
                    if (map.getLayer('water')) {
                        map.setPaintProperty('water', 'fill-color', brandBlue);
                    }
                    // Ubah warna garis jalan utama (kalau ada layer transportation_major_road)
                    const mainRoadLayers = map.getStyle().layers?.filter({
                        "FullMap.useEffect": (l)=>l.id.includes('road') || l.id.includes('transport')
                    }["FullMap.useEffect"]);
                    if (mainRoadLayers) {
                        mainRoadLayers.forEach({
                            "FullMap.useEffect": (layer)=>{
                                if (layer.type === 'line') {
                                    try {
                                        map.setPaintProperty(layer.id, 'line-color', brandBlue);
                                        map.setPaintProperty(layer.id, 'line-opacity', 0.7);
                                    } catch (err) {
                                    // abaikan layer yang tidak punya properti line-color
                                    }
                                }
                            }
                        }["FullMap.useEffect"]);
                    }
                    // Label kota / teks agar tetap terbaca di atas layer biru
                    const labelLayers = map.getStyle().layers?.filter({
                        "FullMap.useEffect": (l)=>l.type === 'symbol' && l.id.includes('label')
                    }["FullMap.useEffect"]);
                    if (labelLayers) {
                        labelLayers.forEach({
                            "FullMap.useEffect": (layer)=>{
                                try {
                                    map.setPaintProperty(layer.id, 'text-color', '#1e293b'); // abu tua
                                    map.setPaintProperty(layer.id, 'text-halo-color', brandWhite);
                                    map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
                                } catch (err) {}
                            }
                        }["FullMap.useEffect"]);
                    }
                    // Batas negara atau provinsi
                    const boundaryLayers = map.getStyle().layers?.filter({
                        "FullMap.useEffect": (l)=>l.id.includes('boundary')
                    }["FullMap.useEffect"]);
                    if (boundaryLayers) {
                        boundaryLayers.forEach({
                            "FullMap.useEffect": (layer)=>{
                                try {
                                    map.setPaintProperty(layer.id, 'line-color', '#93c5fd'); // biru muda lembut
                                } catch (err) {}
                            }
                        }["FullMap.useEffect"]);
                    }
                    // Fit ke seluruh Indonesia
                    map.fitBounds(IDN_BOUNDS, {
                        padding: 40,
                        duration: 800
                    });
                }
            }["FullMap.useEffect"]);
            // Tambahkan kontrol navigasi (zoom, rotate)
            map.addControl(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$maplibre$2d$gl$2f$dist$2f$maplibre$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].NavigationControl({
                visualizePitch: true
            }), 'top-right');
            // Cleanup ketika komponen di-unmount
            return ({
                "FullMap.useEffect": ()=>{
                    map.remove();
                    mapRef.current = null;
                }
            })["FullMap.useEffect"];
        }
    }["FullMap.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-[#004AAD]"
            }, void 0, false, {
                fileName: "[project]/components/FullMap.tsx",
                lineNumber: 107,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-3 right-16 z-20 pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/images/Logo_BNPB.png",
                    alt: "BNPB",
                    className: "h-15 w-auto drop-shadow-md"
                }, void 0, false, {
                    fileName: "[project]/components/FullMap.tsx",
                    lineNumber: 110,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/FullMap.tsx",
                lineNumber: 109,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: containerRef,
                className: "h-full w-full relative z-10"
            }, void 0, false, {
                fileName: "[project]/components/FullMap.tsx",
                lineNumber: 116,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-3 left-3 z-20 text-white text-xs bg-[#004AAD]/80 px-3 py-1 rounded-md shadow",
                children: "© MScode – Map powered by MapLibre GL"
            }, void 0, false, {
                fileName: "[project]/components/FullMap.tsx",
                lineNumber: 117,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/FullMap.tsx",
        lineNumber: 105,
        columnNumber: 9
    }, this);
}
_s(FullMap, "4wnSo2BWjuiqTl0e7W6pwswyqtg=");
_c = FullMap;
var _c;
__turbopack_context__.k.register(_c, "FullMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_2e8707d7._.js.map