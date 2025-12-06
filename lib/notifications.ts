/**
 * Utilidades para notificaciones de escritorio y sonidos
 */

// Solicitar permiso para notificaciones
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones de escritorio')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

// Mostrar notificación de escritorio
export function showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options,
        })

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000)

        return notification
    }
    return null
}

// Reproducir sonido de notificación usando Web Audio API
export function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Crear un oscilador para generar el tono
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Configurar el sonido (tono agradable)
        oscillator.frequency.value = 800 // Frecuencia en Hz
        oscillator.type = 'sine' // Tipo de onda

        // Configurar volumen con fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        // Reproducir
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
        console.error('Error reproduciendo sonido:', error)
    }
}

// Verificar si la página está en foco
export function isPageVisible(): boolean {
    return document.visibilityState === 'visible'
}

// Verificar si el usuario está inactivo (no ha interactuado recientemente)
let lastInteractionTime = Date.now()

// Actualizar tiempo de última interacción
if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            lastInteractionTime = Date.now()
        }, { passive: true })
    })
}

export function isUserIdle(idleThresholdMs: number = 30000): boolean {
    return Date.now() - lastInteractionTime > idleThresholdMs
}
