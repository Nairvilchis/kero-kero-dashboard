import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route para validar la contraseña del dashboard
 * Esta es una ruta del lado del servidor (no expone credenciales al cliente)
 */
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()

        // Obtener contraseña configurada (del lado del servidor, NO expuesta al cliente)
        const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD
        const API_KEY = process.env.API_KEY
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

        console.log('🔐 Login attempt received')
        console.log('📝 DASHBOARD_PASSWORD configured:', !!DASHBOARD_PASSWORD)
        console.log('🔑 API_KEY configured:', !!API_KEY)
        console.log('🌐 API_URL:', API_URL)

        // Validar que haya contraseña configurada
        if (!DASHBOARD_PASSWORD) {
            console.error('❌ DASHBOARD_PASSWORD not configured!')
            return NextResponse.json(
                { error: 'Dashboard no configurado correctamente - falta DASHBOARD_PASSWORD' },
                { status: 500 }
            )
        }

        if (!API_KEY) {
            console.error('❌ API_KEY not configured!')
            return NextResponse.json(
                { error: 'Dashboard no configurado correctamente - falta API_KEY' },
                { status: 500 }
            )
        }

        // Validar contraseña
        if (password !== DASHBOARD_PASSWORD) {
            console.log('❌ Password mismatch')
            return NextResponse.json(
                { error: 'Contraseña incorrecta' },
                { status: 401 }
            )
        }

        console.log('✅ Password validated, calling backend...')

        // Si la contraseña es correcta, hacer login con el servidor backend
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: API_KEY
            })
        })

        console.log('📡 Backend response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Backend error:', errorText)
            throw new Error('Error autenticando con el servidor: ' + errorText)
        }

        const data = await response.json()
        console.log('✅ JWT token received from backend')

        // Devolver el token JWT al cliente
        return NextResponse.json({
            success: true,
            token: data.token,
            expires_at: data.expires_at
        })

    } catch (error) {
        console.error('💥 Error en login:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 500 }
        )
    }
}
