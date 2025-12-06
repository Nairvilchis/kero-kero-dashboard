'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const jwtToken = localStorage.getItem('kero_jwt_token')
        const jwtExpires = localStorage.getItem('kero_jwt_expires')
        const apiKey = localStorage.getItem('kero_api_key')

        // Si estamos en la página de login, no hacer nada
        if (pathname === '/login') {
            setAuthorized(true)
            return
        }

        // Verificar si hay token JWT
        if (!jwtToken && !apiKey) {
            router.push('/login')
            return
        }

        // Verificar si el token JWT ha expirado
        if (jwtToken && jwtExpires) {
            const expiresAt = parseInt(jwtExpires)
            const now = Math.floor(Date.now() / 1000)

            if (now > expiresAt) {
                // Token expirado, limpiar y redirigir al login
                localStorage.removeItem('kero_jwt_token')
                localStorage.removeItem('kero_jwt_expires')
                router.push('/login')
                return
            }
        }

        setAuthorized(true)
    }, [router, pathname])

    // Evitar flash de contenido protegido
    if (!authorized && pathname !== '/login') {
        return null
    }

    return <>{children}</>
}
