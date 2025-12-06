'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { instancesApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import InstanceCard from '@/components/instances/InstanceCard'
import CreateInstanceModal from '@/components/instances/CreateInstanceModal'
import LogoutButton from '@/components/LogoutButton'
import { Plus, MessageSquare, Users, Settings, RefreshCw, Loader2 } from 'lucide-react'

export default function Home() {
    const instances = useAppStore((state) => state.instances)
    const setInstances = useAppStore((state) => state.setInstances)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchInstances = async () => {
        setLoading(true)
        try {
            const response = await instancesApi.list()
            console.log('API Response:', response)
            console.log('API Response Data:', response.data)

            // El backend devuelve { success: true, data: [...], total: N }
            // Axios envuelve eso en response.data
            const instances = response.data.data || []
            console.log('Instances array:', instances)

            // Adaptar respuesta del backend al formato del store
            const formatted = instances.map((inst: any) => {
                console.log('Processing instance:', inst)
                return {
                    id: inst.instance_id,
                    name: inst.name || inst.instance_id,
                    status: inst.status === 'connected' ? 'connected' :
                        inst.status === 'connecting' ? 'connecting' : 'disconnected',
                    phone: inst.jid ? inst.jid.split('@')[0] : undefined
                }
            })
            console.log('Formatted instances:', formatted)
            setInstances(formatted)
        } catch (error) {
            console.error('Error fetching instances:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstances()
    }, [])

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            K
                        </div>
                        <span className="font-bold text-xl tracking-tight">Kero-Kero</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/settings" className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <Settings className="w-5 h-5" />
                        </Link>
                        <LogoutButton variant="icon" />
                    </div>
                </div>
            </header>

            <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Mis Instancias</h1>
                        <p className="text-zinc-500">Gestiona tus conexiones de WhatsApp desde aquí.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchInstances}
                            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Recargar lista"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Nueva Instancia
                        </button>
                    </div>
                </div>

                {/* Grid de Instancias */}
                {loading && instances.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : instances.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {instances.map((instance) => (
                            <div key={instance.id} className="flex flex-col h-full">
                                <InstanceCard {...instance} />

                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No tienes instancias creadas</h3>
                        <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
                            Crea una nueva instancia para conectar tu WhatsApp y empezar a usar el dashboard.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Instancia
                        </button>
                    </div>
                )}
            </div>

            <CreateInstanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </main>
    )
}
