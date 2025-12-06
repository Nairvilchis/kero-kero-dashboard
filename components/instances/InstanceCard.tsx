import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api, instancesApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Loader2, Power, Trash2, QrCode, Smartphone } from 'lucide-react'

interface InstanceCardProps {
    id: string
    name: string
    status: 'connected' | 'disconnected' | 'connecting'
    phone?: string
}

export default function InstanceCard({ id, name, status, phone }: InstanceCardProps) {
    const [loading, setLoading] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const removeInstance = useAppStore((state) => state.removeInstance)
    const updateStatus = useAppStore((state) => state.updateInstanceStatus)

    // Escuchar eventos de WebSocket para actualizar QR automáticamente
    useEffect(() => {
        const handleWebSocketMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data)

                // Si es un evento de QR para esta instancia
                if (data.type === 'qr' && data.payload?.instance_id === id) {
                    const qrData = data.payload.qr
                    const qrImage = qrData.startsWith('data:')
                        ? qrData
                        : `data:image/png;base64,${qrData}`
                    setQrCode(qrImage)
                    console.log('QR actualizado via WebSocket para', id)
                }

                // Si la instancia se conectó, limpiar el QR
                if (data.type === 'connected' && data.payload?.instance_id === id) {
                    setQrCode(null)
                }
            } catch (error) {
                // Ignorar errores de parsing
            }
        }

        // Buscar el WebSocket existente (asumiendo que hay uno global)
        // En producción, esto debería venir de un contexto o hook
        if (typeof window !== 'undefined' && (window as any).wsConnection) {
            const ws = (window as any).wsConnection
            ws.addEventListener('message', handleWebSocketMessage)

            return () => {
                ws.removeEventListener('message', handleWebSocketMessage)
            }
        }
    }, [id])

    const handleConnect = async () => {
        setLoading(true)
        try {
            // 1. Iniciar conexión
            await instancesApi.connect(id)
            updateStatus(id, 'connecting')

            // 2. Polling del QR (intentar hasta 30 segundos)
            let attempts = 0
            const maxAttempts = 30
            const pollInterval = 1000 // 1 segundo

            const pollQR = async (): Promise<boolean> => {
                try {
                    const { data } = await instancesApi.qr(id)
                    console.log('QR Response (attempt', attempts + 1, '):', data)

                    if (data.qr_code || data.qr) {
                        // Asegurar formato base64
                        const qrData = data.qr_code || data.qr
                        const qrImage = qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`
                        setQrCode(qrImage)
                        return true // QR obtenido exitosamente
                    }
                    return false // QR no disponible aún
                } catch (error: any) {
                    // Si es 400, la instancia ya está autenticada
                    if (error.response?.status === 400) {
                        console.log('Instancia ya autenticada, deteniendo polling')
                        setQrCode(null) // Limpiar QR
                        updateStatus(id, 'connected')
                        return true // Detener polling
                    }
                    // Si es 404 o 503, continuar intentando
                    if (error.response?.status === 404 || error.response?.status === 503) {
                        return false
                    }
                    // Otros errores, propagar
                    throw error
                }
            }

            // Intentar obtener el QR con polling
            while (attempts < maxAttempts) {
                const success = await pollQR()
                if (success) {
                    console.log('QR obtenido exitosamente o instancia autenticada')
                    break
                }
                attempts++
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval))
                }
            }

            if (attempts >= maxAttempts) {
                console.warn('Timeout esperando QR')
                // No mostrar alert si la instancia se conectó via WebSocket
                if (status !== 'connected') {
                    alert('No se pudo obtener el código QR. Intenta de nuevo.')
                }
            }
        } catch (error) {
            console.error('Error connecting:', error)
            alert('Error al conectar. Revisa la consola.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        if (!confirm('¿Estás seguro de desconectar esta instancia?')) return
        setLoading(true)
        try {
            await instancesApi.logout(id)
            updateStatus(id, 'disconnected')
            setQrCode(null)
        } catch (error) {
            console.error('Error logging out:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta instancia permanentemente?')) return
        setLoading(true)
        try {
            await instancesApi.delete(id)
            removeInstance(id)
        } catch (error) {
            console.error('Error deleting:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
            {/* Área clickeable que lleva a la página de la instancia */}
            <Link
                href={`/instance/${id}`}
                className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer flex-1 flex flex-col"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{name || id}</h3>
                        <p className="text-sm text-zinc-500 font-mono">{id}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
                        ${status === 'connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            status === 'connecting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-zinc-400'}`}></span>
                        {status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                    </div>
                </div>

                {status === 'connected' && phone && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                        <Smartphone className="w-4 h-4" />
                        <span>{phone}</span>
                    </div>
                )}

                {qrCode && status !== 'connected' && (
                    <div className="mb-4 flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">Escanea con WhatsApp</p>
                    </div>
                )}

                {!qrCode && status === 'connecting' && (
                    <div className="mb-4 flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-2" />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">Generando código QR...</p>
                    </div>
                )}
            </Link>

            {/* Botones de acción (no clickeables con el link) */}
            <div className="flex gap-2 p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 mt-auto" onClick={(e) => e.stopPropagation()}>
                {status === 'disconnected' ? (
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        {loading ? 'Conectando...' : 'Conectar'}
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        {loading ? 'Desconectando...' : 'Desconectar'}
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title="Eliminar instancia"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    )
}
