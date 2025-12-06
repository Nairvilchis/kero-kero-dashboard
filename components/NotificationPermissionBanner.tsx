'use client'

import { useEffect, useState } from 'react'
import { requestNotificationPermission } from '@/lib/notifications'
import { Bell, X } from 'lucide-react'

/**
 * Componente que solicita permiso de notificaciones una sola vez
 * y muestra un banner discreto si el usuario no ha decidido
 */
export default function NotificationPermissionBanner() {
    const [showBanner, setShowBanner] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return
        }

        const currentPermission = Notification.permission
        setPermission(currentPermission)

        // Mostrar banner solo si el permiso está en 'default' (no decidido)
        // y el usuario no ha cerrado el banner antes
        const bannerDismissed = localStorage.getItem('notification_banner_dismissed')
        if (currentPermission === 'default' && !bannerDismissed) {
            // Esperar 2 segundos antes de mostrar el banner (para no ser intrusivo)
            const timer = setTimeout(() => {
                setShowBanner(true)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission()
        setPermission(granted ? 'granted' : 'denied')
        setShowBanner(false)
        if (!granted) {
            // Si el usuario rechaza, recordar que ya se le preguntó
            localStorage.setItem('notification_banner_dismissed', 'true')
        }
    }

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('notification_banner_dismissed', 'true')
    }

    if (!showBanner || permission !== 'default') {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Habilitar notificaciones</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                        Recibe alertas cuando lleguen nuevos mensajes, incluso cuando no estés viendo la página.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRequestPermission}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                        >
                            Permitir
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium rounded transition-colors"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
