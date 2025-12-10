'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteInstance, logoutInstance, connectInstance, getInstanceQR } from '@/app/instances/actions'
import { useAppStore } from '@/lib/store'
import {
    MoreVertical,
    Trash2,
    LogOut,
    QrCode,
    MessageSquare,
    Settings,
    Smartphone,
    Wifi,
    WifiOff,
    Loader2
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface InstanceProps {
    id: string
    name: string
    status: string
    phone?: string
}

export default function InstanceCard({ id, name, status, phone }: InstanceProps) {
    const router = useRouter()
    const removeInstance = useAppStore((state) => state.removeInstance)
    const updateInstanceStatus = useAppStore((state) => state.updateInstanceStatus)

    const [showMenu, setShowMenu] = useState(false)
    const [showQr, setShowQr] = useState(false)
    const [qrCode, setQrCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleConnect = async () => {
        setLoading(true)
        try {
            await connectInstance(id)

            // Poll for QR code logic
            let attempts = 0
            const maxAttempts = 10
            const pollInterval = 1500 // 1.5s

            const pollQr = async () => {
                try {
                    const data = await getInstanceQR(id)
                    console.log('QR Data:', data)

                    // Si ya está conectado (la API devuelve connected o similar en lugar de QR)
                    if (data.status === 'connected') {
                        setShowQr(false)
                        setQrCode('')
                        updateInstanceStatus(id, 'connected')
                        setLoading(false)
                        return
                    }

                    if (data.code) {
                        setQrCode(data.code)
                        setShowQr(true)
                        setLoading(false)
                        // Seguir haciendo polling por si cambia a conectado?
                        // Por ahora asumimos que el usuario escanea y luego refresca o implementamos sse luego
                    } else if (attempts < maxAttempts) {
                        attempts++
                        setTimeout(pollQr, pollInterval)
                    } else {
                        setLoading(false)
                        alert('No se pudo obtener el código QR a tiempo.')
                    }
                } catch (error) {
                    console.error('Error polling QR:', error)
                    if (attempts < maxAttempts) {
                        attempts++
                        setTimeout(pollQr, pollInterval)
                    } else {
                        setLoading(false)
                    }
                }
            }

            // Iniciar polling tras breve espera
            setTimeout(pollQr, 1000)

        } catch (error) {
            console.error('Error initiating connection:', error)
            setLoading(false)
            alert('Error al iniciar conexión')
        }
    }

    const handleLogout = async () => {
        if (!confirm('¿Estás seguro de cerrar sesión?')) return
        setLoading(true)
        try {
            await logoutInstance(id)
            updateInstanceStatus(id, 'disconnected')
            setShowMenu(false)
            setQrCode('')
            setShowQr(false)
        } catch (error) {
            console.error('Error logging out:', error)
            alert('Error al cerrar sesión')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta instancia?')) return
        setLoading(true)
        try {
            await deleteInstance(id)
            removeInstance(id)
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Error eliminando la instancia')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'connected'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                        }`}>
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{name}</h3>
                        <p className="text-sm text-zinc-500 font-mono">{id}</p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-zinc-400" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-20 py-1">
                                <Link
                                    href={`/instance/${id}`}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    Configuración
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {status === 'connected' ? 'Conectado' : 'Desconectado'}
                    </span>
                    {phone && (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">
                            {phone}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    {status === 'connected' ? (
                        <>
                            <Link
                                href={`/chat?instance=${id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Chat"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Desconectar"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={loading || showQr}
                            className={`flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ${loading || showQr ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <QrCode className="w-4 h-4" />
                            )}
                            {showQr ? 'Escanea el QR' : 'Conectar'}
                        </button>
                    )}
                </div>
            </div>

            {/* QR Code Display */}
            {showQr && qrCode && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-zinc-200 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <QRCodeSVG value={qrCode} size={190} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-4 text-center">
                        Abre WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo
                    </p>
                    <button
                        onClick={() => { setShowQr(false); setQrCode('') }}
                        className="mt-4 text-xs text-zinc-400 hover:text-zinc-600 underline"
                    >
                        Cerrar QR
                    </button>
                </div>
            )}
        </div>
    )
}
