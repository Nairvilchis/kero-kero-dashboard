'use client'

import { useState, useEffect } from 'react'
import { Database, Server, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

interface HealthStatus {
    status: string
    database: string
    redis: string
    database_error?: string
    redis_error?: string
}

interface SystemInfo {
    app_name: string
    app_env: string
    version: string
    database: string
    server_url: string
}

export default function SettingsPage() {
    const [apiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
    const [healthLoading, setHealthLoading] = useState(false)
    const [infoLoading, setInfoLoading] = useState(false)

    useEffect(() => {
        // Verificar salud del servidor
        checkHealth()
        // Obtener información del sistema
        getSystemInfo()
    }, [])

    const checkHealth = async () => {
        setHealthLoading(true)
        try {
            const response = await fetch(`${apiUrl}/health`)
            const data = await response.json()
            setHealth(data)
        } catch (error) {
            console.error('Error checking health:', error)
            setHealth({
                status: 'error',
                database: 'unknown',
                redis: 'unknown'
            })
        } finally {
            setHealthLoading(false)
        }
    }

    const getSystemInfo = async () => {
        setInfoLoading(true)
        try {
            const response = await fetch(`${apiUrl}/system/info`)
            const data = await response.json()
            setSystemInfo(data)
        } catch (error) {
            console.error('Error getting system info:', error)
        } finally {
            setInfoLoading(false)
        }
    }

    const getDatabaseLabel = (dbType: string) => {
        return dbType === 'sqlite' ? 'SQLite' : dbType === 'postgres' ? 'PostgreSQL' : dbType
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <Link href="/" className="font-bold text-xl tracking-tight">
                        Kero-Kero
                    </Link>
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <h1 className="font-semibold">Ajustes</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Información del Sistema */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold">Información del Sistema</h2>
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">Configuración del servidor y servicios.</p>
                    </div>

                    <div className="p-6">
                        {infoLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                            </div>
                        ) : systemInfo ? (
                            <div className="space-y-3">
                                {/* Servidor */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <Server className="w-4 h-4 text-zinc-500" />
                                        <span className="text-sm font-medium">Servidor</span>
                                    </div>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                                        {apiUrl}
                                    </span>
                                </div>

                                {/* Base de Datos */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <Database className="w-4 h-4 text-zinc-500" />
                                        <span className="text-sm font-medium">Base de Datos</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                            {getDatabaseLabel(systemInfo.database)}
                                        </span>
                                    </div>
                                </div>

                                {/* Ambiente */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-zinc-500" />
                                        <span className="text-sm font-medium">Ambiente</span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${systemInfo.app_env === 'production'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                        }`}>
                                        {systemInfo.app_env}
                                    </span>
                                </div>

                                {/* Versión */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <span className="text-sm font-medium">Versión</span>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                                        v{systemInfo.version}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-sm text-zinc-500">
                                No se pudo obtener información del sistema
                            </div>
                        )}
                    </div>
                </div>

                {/* Estado de Conexión */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Estado de Conexión</h2>
                                <p className="text-sm text-zinc-500 mt-1">Monitoreo de servicios del servidor.</p>
                            </div>
                            <button
                                onClick={() => {
                                    checkHealth()
                                    getSystemInfo()
                                }}
                                disabled={healthLoading}
                                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {healthLoading ? 'Verificando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {health ? (
                            <div className="space-y-3">
                                {/* Estado General */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <span className="text-sm font-medium">Estado General</span>
                                    <div className="flex items-center gap-2">
                                        {health.status === 'healthy' ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-600 font-medium">Saludable</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-red-600 font-medium">Con Problemas</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Base de Datos */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <span className="text-sm font-medium">Conexión Base de Datos</span>
                                    <div className="flex items-center gap-2">
                                        {health.database === 'ok' ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-600">Conectada</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-red-600">Error</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {health.database_error && (
                                    <p className="text-xs text-red-600 ml-3 mt-1">{health.database_error}</p>
                                )}

                                {/* Redis */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <span className="text-sm font-medium">Conexión Redis</span>
                                    <div className="flex items-center gap-2">
                                        {health.redis === 'ok' ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-600">Conectado</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-red-600">Error</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {health.redis_error && (
                                    <p className="text-xs text-red-600 ml-3 mt-1">{health.redis_error}</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Zona de Peligro */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">Zona de Peligro</h3>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-200">Cerrar Sesión</p>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                                    Eliminará tu sesión del dashboard
                                </p>
                            </div>
                            <LogoutButton className="bg-red-600 hover:bg-red-700 text-white border-0" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
