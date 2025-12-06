'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Settings, X, Play, Square } from 'lucide-react'
import { syncApi } from '@/lib/api'

interface SyncControlProps {
    instanceId: string
    onComplete?: () => void
}

interface SyncProgress {
    status: string
    total_chats: number
    processed_chats: number
    synced_messages: number
    current_chat: string
    error?: string
}

export default function SyncControl({ instanceId, onComplete }: SyncControlProps) {
    const [showOptions, setShowOptions] = useState(false)
    const [progress, setProgress] = useState<SyncProgress | null>(null)
    const [loading, setLoading] = useState(false)

    // Opciones
    const [advanced, setAdvanced] = useState(false)
    const [msgLimit, setMsgLimit] = useState(50)
    const [chatLimit, setChatLimit] = useState(20)

    // Polling de progreso
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (progress?.status === 'running') {
            interval = setInterval(async () => {
                try {
                    const res = await syncApi.getProgress(instanceId)
                    if (res.data.success) {
                        setProgress(res.data.data)
                        if (res.data.data.status === 'completed' || res.data.data.status === 'failed') {
                            if (res.data.data.status === 'completed' && onComplete) {
                                onComplete()
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking sync progress:', error)
                }
            }, 2000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [instanceId, progress?.status, onComplete])

    const startSync = async () => {
        setLoading(true)
        try {
            await syncApi.start(instanceId, {
                messages_per_chat: msgLimit,
                max_chats: advanced ? (chatLimit === 0 ? 0 : chatLimit) : 20,
                advanced
            })

            // Iniciar polling inmediatamente
            setProgress({
                status: 'running',
                total_chats: 0,
                processed_chats: 0,
                synced_messages: 0,
                current_chat: 'Iniciando...'
            })
        } catch (error) {
            console.error('Error starting sync:', error)
            alert('Error al iniciar sincronización')
        } finally {
            setLoading(false)
            setShowOptions(false)
        }
    }

    const cancelSync = async () => {
        try {
            await syncApi.cancel(instanceId)
            setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null)
        } catch (error) {
            console.error('Error cancelling sync:', error)
        }
    }

    if (progress?.status === 'running') {
        const percent = progress.total_chats > 0
            ? Math.round((progress.processed_chats / progress.total_chats) * 100)
            : 0

        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sincronizando historial...
                    </h3>
                    <button
                        onClick={cancelSync}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                        <Square className="w-3 h-3 fill-current" /> Cancelar
                    </button>
                </div>

                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 mb-2">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                    <span>{progress.processed_chats} / {progress.total_chats} chats</span>
                    <span>{progress.synced_messages} msgs</span>
                </div>
                <p className="text-xs text-blue-500 mt-1 truncate">
                    Procesando: {progress.current_chat}
                </p>
            </div>
        )
    }

    return (
        <div className="mt-4">
            {!showOptions ? (
                <button
                    onClick={() => setShowOptions(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar historial de mensajes
                </button>
            ) : (
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Sincronización de Historial</h3>
                        <button onClick={() => setShowOptions(false)} className="text-zinc-400 hover:text-zinc-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="advanced"
                                checked={advanced}
                                onChange={(e) => setAdvanced(e.target.checked)}
                                className="rounded border-zinc-300"
                            />
                            <label htmlFor="advanced" className="text-sm">Opciones avanzadas</label>
                        </div>

                        {advanced ? (
                            <>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Mensajes por chat</label>
                                    <select
                                        value={msgLimit}
                                        onChange={(e) => setMsgLimit(Number(e.target.value))}
                                        className="w-full p-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    >
                                        <option value={50}>50 mensajes (Rápido)</option>
                                        <option value={100}>100 mensajes</option>
                                        <option value={500}>500 mensajes</option>
                                        <option value={1000}>1000 mensajes (Lento)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Límite de chats</label>
                                    <select
                                        value={chatLimit}
                                        onChange={(e) => setChatLimit(Number(e.target.value))}
                                        className="w-full p-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    >
                                        <option value={20}>Últimos 20 chats</option>
                                        <option value={50}>Últimos 50 chats</option>
                                        <option value={0}>Todos los chats (Muy lento)</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-zinc-500">
                                Se sincronizarán los últimos 50 mensajes de los 20 chats más recientes.
                            </p>
                        )}

                        <button
                            onClick={startSync}
                            disabled={loading}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Iniciar Sincronización
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
