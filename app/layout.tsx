import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import WebSocketInitializer from '@/components/WebSocketInitializer'
import AuthGuard from '@/components/AuthGuard'
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Kero-Kero Dashboard',
    description: 'Panel de administración para Kero-Kero WhatsApp API',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <AuthGuard>
                    <WebSocketInitializer />
                    <NotificationPermissionBanner />
                    {children}
                </AuthGuard>
            </body>
        </html>
    )
}
