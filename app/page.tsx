import Drawer from '@/components/Drawer'
import FullMap from '@/components/FullMap'

export default function HomePage() {
    return (
        <div className="relative h-screen w-screen">
            <FullMap />
            <Drawer>
                <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">Filter cepat</p>
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="accent-blue-600" /> Tsunami
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="accent-blue-600" /> Gempa
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="accent-blue-600" /> Banjir
                        </label>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}
