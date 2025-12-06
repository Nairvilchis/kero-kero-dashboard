'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { instancesApi, webhookApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { MessageSquare, Users, Settings, Activity, Power, Trash2, ArrowLeft, Terminal } from 'lucide-react'
import Link from 'next/link'
import ApiCheatSheetModal from '@/components/instances/ApiCheatSheetModal'
import ChatInterface from '@/components/chat/ChatInterface'
import CRMInterface from '@/components/crm/CRMInterface'
import SyncControl from '@/components/instances/SyncControl'

// ... (dentro del componente)

export default function InstancePage() {
    const params = useParams()
    const instanceId = params.id as string
    const [activeTab, setActiveTab] = useState('chat')
    const [instance, setInstance] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isApiModalOpen, setIsApiModalOpen] = useState(false)
    const [webhookConfig, setWebhookConfig] = useState<any>({
        url: '',
        events: ['message', 'status', 'receipt'],
        secret: '',
        enabled: true
    })

    // ... (resto del código)

    useEffect(() => {
        const fetchInstance = async () => {
            try {
                const response = await instancesApi.list()
                const instances = response.data.data || []
                const found = instances.find((inst: any) => inst.instance_id === instanceId)

                if (found) {
                    setInstance({
                        id: found.instance_id,
                        name: found.name || found.instance_id,
                        status: found.status,
                        phone: found.jid ? found.jid.split('@')[0] : undefined,
                        webhook_url: found.webhook_url,
                        sync_history: found.sync_history
                    })

                    // Cargar configuración de webhook desde Redis
                    try {
                        const webhookResponse = await webhookApi.get(instanceId)
                        if (webhookResponse.data) {
                            setWebhookConfig({
                                url: webhookResponse.data.url || found.webhook_url || '',
                                events: webhookResponse.data.events || ['message', 'status', 'receipt'],
                                secret: webhookResponse.data.secret || '',
                                enabled: webhookResponse.data.enabled !== undefined ? webhookResponse.data.enabled : true
                            })
                        } else {
                            // Si no hay config en Redis, usar valores por defecto con la URL de la BD
                            setWebhookConfig({
                                url: found.webhook_url || '',
                                events: ['message', 'status', 'receipt'],
                                secret: '',
                                enabled: true
                            })
                        }
                    } catch (error) {
                        console.log('No webhook config in Redis, using defaults')
                        setWebhookConfig({
                            url: found.webhook_url || '',
                            events: ['message', 'status', 'receipt'],
                            secret: '',
                            enabled: true
                        })
                    }
                }
            } catch (error) {
                console.error('Error fetching instance:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInstance()
    }, [instanceId])

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!instance) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Instancia no encontrada</h1>
                    <Link href="/" className="text-blue-600 hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'crm', label: 'CRM', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: Activity },
        { id: 'settings', label: 'Configuración', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-xl">{instance.name}</h1>
                            <p className="text-xs text-zinc-500">{instance.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                            ${instance.status === 'connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}
                        >
                            <Power className="w-3 h-3" />
                            {instance.status === 'connected' ? 'Conectado' :
                                instance.status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                        </div>
                        <button
                            onClick={() => setIsApiModalOpen(true)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Ver API"
                        >
                            <Terminal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'chat' && (
                    <ChatInterface instanceId={instanceId} />
                )}

                {activeTab === 'crm' && (
                    <CRMInterface instanceId={instanceId} />
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Analytics</h2>
                        <p className="text-zinc-500">Estadísticas y métricas para {instance.name}</p>
                        <div className="flex items-center justify-center h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                            <p className="text-zinc-400">Próximamente: Gráficos de mensajes, tiempos de respuesta, etc.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Configuración de la Instancia</h2>
                        <p className="text-zinc-500 mb-6">Administra los ajustes generales y de conexión.</p>

                        <div className="space-y-6">
                            {/* Información Básica */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Información General
                                    </h3>
                                    <button
                                        onClick={() => setIsApiModalOpen(true)}
                                        className="text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
                                    >
                                        <Terminal className="w-3 h-3" />
                                        Ver Comandos API
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">ID de Instancia</label>
                                        <input
                                            type="text"
                                            value={instance.id}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-zinc-600"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">El ID es único y no se puede cambiar.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Nombre Visible</label>
                                        <input
                                            type="text"
                                            value={instance.name}
                                            onChange={(e) => setInstance({ ...instance, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Ej: Ventas Principal"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                        <input
                                            type="checkbox"
                                            id="sync_history"
                                            checked={instance.sync_history || false}
                                            onChange={(e) => setInstance({ ...instance, sync_history: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <label htmlFor="sync_history" className="font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
                                                Sincronización Automática de Historial
                                            </label>
                                            <p className="text-xs text-zinc-500">
                                                Si se activa, se intentará descargar el historial de mensajes al conectar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sincronización de Mensajes */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Historial de Mensajes
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    Sincroniza los mensajes antiguos de WhatsApp para tener el historial completo en el sistema.
                                </p>
                                <SyncControl instanceId={instanceId} />
                            </div>

                            {/* Webhook */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Webhook y Eventos
                                        </h3>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Configura notificaciones en tiempo real para eventos de WhatsApp
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="webhook_enabled"
                                            checked={webhookConfig.enabled}
                                            onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked })}
                                            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="webhook_enabled" className="text-sm font-medium cursor-pointer">
                                            {webhookConfig.enabled ? 'Habilitado' : 'Deshabilitado'}
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">URL del Webhook</label>
                                        <input
                                            type="url"
                                            value={webhookConfig.url}
                                            onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="https://tu-api.com/webhook"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">Recibirás notificaciones POST en esta URL para los eventos seleccionados.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Eventos a Notificar</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'message', label: 'Mensajes', desc: 'Mensajes entrantes y salientes' },
                                                { id: 'status', label: 'Estado', desc: 'Conexión/desconexión' },
                                                { id: 'receipt', label: 'Confirmaciones', desc: 'Lectura y entrega' },
                                                { id: 'presence', label: 'Presencia', desc: 'Escribiendo, en línea' }
                                            ].map((event) => (
                                                <div key={event.id} className="flex items-start gap-2 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                                    <input
                                                        type="checkbox"
                                                        id={`event_${event.id}`}
                                                        checked={webhookConfig.events.includes(event.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setWebhookConfig({
                                                                    ...webhookConfig,
                                                                    events: [...webhookConfig.events, event.id]
                                                                })
                                                            } else {
                                                                setWebhookConfig({
                                                                    ...webhookConfig,
                                                                    events: webhookConfig.events.filter((ev: string) => ev !== event.id)
                                                                })
                                                            }
                                                        }}
                                                        className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1">
                                                        <label htmlFor={`event_${event.id}`} className="text-sm font-medium cursor-pointer block">
                                                            {event.label}
                                                        </label>
                                                        <p className="text-xs text-zinc-500">{event.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                                            Secret (Opcional)
                                        </label>
                                        <input
                                            type="password"
                                            value={webhookConfig.secret}
                                            onChange={(e) => setWebhookConfig({ ...webhookConfig, secret: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Clave secreta para firmar requests"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Si se configura, los requests incluirán un header <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">X-Webhook-Signature</code> con firma HMAC-SHA256
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Guardar */}
                            <div className="flex justify-end">
                                <button
                                    onClick={async () => {
                                        try {
                                            // Guardar configuración básica de la instancia
                                            await instancesApi.update(instance.id, {
                                                name: instance.name,
                                                webhook_url: webhookConfig.url, // Usar la URL del webhookConfig
                                                sync_history: instance.sync_history
                                            })

                                            // Guardar configuración avanzada del webhook en Redis
                                            if (webhookConfig.url) {
                                                await webhookApi.set(instance.id, {
                                                    url: webhookConfig.url,
                                                    events: webhookConfig.events,
                                                    secret: webhookConfig.secret,
                                                    enabled: webhookConfig.enabled
                                                })
                                            }

                                            alert('Configuración guardada correctamente')
                                        } catch (error) {
                                            console.error(error)
                                            alert('Error al guardar configuración')
                                        }
                                    }}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Guardar Cambios
                                </button>
                            </div>

                            {/* Zona de Peligro */}
                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <h3 className="font-medium text-red-600 mb-4 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Zona de Peligro
                                </h3>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-red-900 dark:text-red-200">Eliminar Instancia</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                            Esta acción es irreversible. Se perderá la sesión y todos los datos asociados.
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm('¿Estás seguro de eliminar esta instancia?')) {
                                                try {
                                                    // await instancesApi.delete(instance.id)
                                                    alert('Funcionalidad de eliminar pendiente de implementar en frontend')
                                                } catch (error) {
                                                    console.error(error)
                                                }
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Eliminar Definitivamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ApiCheatSheetModal
                isOpen={isApiModalOpen}
                onClose={() => setIsApiModalOpen(false)}
                instanceId={instanceId}
            />
        </div>
    )
}
