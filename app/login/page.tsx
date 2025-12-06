'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Server, Key } from 'lucide-react'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    // Obtener URL del servidor desde variables de entorno
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    useEffect(() => {
        // Si ya hay token, redirigir al home
        if (localStorage.getItem('kero_jwt_token')) {
            router.push('/')
        }
    }, [router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!password) {
            setError('Por favor ingresa la contraseña')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Llamar a la API route del dashboard (servidor-side)
            // Esto protege las credenciales del servidor backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: password
                })
            })

            const data = await response.json()

            if (response.status === 401) {
                setError('Contraseña incorrecta')
                setLoading(false)
                return
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error de autenticación')
            }

            // Guardar token JWT y configuración
            localStorage.setItem('kero_jwt_token', data.token)
            localStorage.setItem('kero_jwt_expires', data.expires_at.toString())
            localStorage.setItem('kero_api_url', apiUrl)

            // Forzar recarga para actualizar clientes API
            window.location.href = '/'

        } catch (err) {
            console.error(err)
            setError('Error al conectar con el dashboard. Verifica tu configuración.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-8 text-center border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Bienvenido a Kero-Kero</h1>
                    <p className="text-zinc-500 text-sm">Ingresa tu contraseña para acceder al dashboard.</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Información del servidor */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Server className="w-4 h-4" />
                            <span className="font-medium">Servidor:</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono break-all pl-6">
                            {apiUrl}
                        </p>
                    </div>

                    {/* Campo de contraseña */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Contraseña del Dashboard
                            </div>
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                console.log('Password changed:', e.target.value.length > 0 ? `${e.target.value.length} chars` : 'empty')
                                setPassword(e.target.value)
                            }}
                            placeholder="Ingresa tu contraseña"
                            required
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Configurada en <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">DASHBOARD_PASSWORD</code>
                        </p>
                        {/* Debug info */}
                        <p className="text-xs text-zinc-400 mt-1">
                            Estado: password={password.length > 0 ? `✓ ${password.length} caracteres` : '✗ vacío'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password}
                        onClick={() => console.log('Button clicked, loading:', loading, 'password:', password.length > 0)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Autenticando...</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5" />
                                <span>Iniciar Sesión</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 text-center text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                    <p>Kero-Kero Dashboard v1.0</p>
                    <p className="mt-1 text-zinc-500">
                        🔒 Protegido con autenticación de doble capa
                    </p>
                </div>
            </div>
        </div>
    )
}
