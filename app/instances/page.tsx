'use client'

import { useEffect, useState } from 'react'
import { instancesApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import InstanceCard from '@/components/instances/InstanceCard'
import CreateInstanceModal from '@/components/instances/CreateInstanceModal'
import { Plus, RefreshCw, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { getInstances } from './actions'

export default function InstancesPage() {
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const instances = useAppStore((state) => state.instances)
    const setInstances = useAppStore((state) => state.setInstances)

    const fetchInstances = async () => {
        setLoading(true)
        try {
            // Usamos la Server Action en lugar de llamar a la API directamente desde el navegador
            // Esto se ejecuta en el backend de Next.js, que sí tiene acceso a kero-server
            const formattedInstances = await getInstances()
            setInstances(formattedInstances)
        } catch (error) {
            console.error('Error fetching instances via SSR Action:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstances()
    }, [])

    const filteredInstances = instances.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="font-bold text-xl tracking-tight">
                            Kero-Kero
                        </Link>
                        <span className="text-zinc-300 dark:text-zinc-700">/</span>
                        <h1 className="font-semibold">Instancias</h1>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Instancia
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar instancia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={fetchInstances}
                        className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Actualizar lista"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Grid */}
                {loading && instances.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredInstances.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInstances.map((instance) => (
                            <InstanceCard
                                key={instance.id}
                                {...instance}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                        <p className="text-zinc-500 mb-4">No se encontraron instancias</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Crear tu primera instancia
                        </button>
                    </div>
                )}
            </main>

            <CreateInstanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
