'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
    className?: string
    variant?: 'icon' | 'full'
}

export default function LogoutButton({ className = '', variant = 'full' }: LogoutButtonProps) {
    const router = useRouter()

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('kero_api_key')
            // Opcional: localStorage.removeItem('kero_api_url') si quieres obligar a reconfigurar URL

            // Forzar recarga para limpiar estados en memoria y redirigir
            window.location.href = '/login'
        }
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleLogout}
                className={`p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`}
                title="Cerrar Sesión"
            >
                <LogOut className="w-5 h-5" />
            </button>
        )
    }

    return (
        <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors ${className}`}
        >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
        </button>
    )
}
