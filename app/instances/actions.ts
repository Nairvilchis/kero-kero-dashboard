'use server'

/**
 * Server Actions para Instancias
 * Estas funciones se ejecutan EXCLUSIVAMENTE en el servidor de Next.js (dentro del contenedor Docker).
 * Esto soluciona los problemas de CORS, Mixed Content y Scope de red, ya que usamos la red interna de Docker.
 */

const API_URL = process.env.INTERNAL_API_URL || 'http://kero-server:8080'
const API_KEY = process.env.API_KEY

if (!API_KEY) {
    console.error('SERVER_ERROR: API_KEY no está definida en las variables de entorno del servidor.')
}

export async function getInstances() {
    try {
        console.log(`[SSR] Fetching instances from ${API_URL}/instances`)

        const res = await fetch(`${API_URL}/instances`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY || '',
                'Cache-Control': 'no-cache'
            },
            // Revalidar en cada petición para tener datos frescos (equivalente a no-cache)
            next: { revalidate: 0 }
        })

        if (!res.ok) {
            console.error(`[SSR] Error fetching instances: ${res.status} ${res.statusText}`)
            throw new Error(`Error del servidor: ${res.status}`)
        }

        const json = await res.json()
        const data = json.data || []

        // Formatear datos para el frontend
        return data.map((inst: any) => ({
            id: inst.instance_id,
            name: inst.name || inst.instance_id,
            status: inst.status === 'connected' ? 'connected' : 'disconnected',
            phone: inst.phone
        }))

    } catch (error) {
        console.error('[SSR] Fallo crítico al obtener instancias:', error)
        // Retornamos array vacío para no romper la UI, pero logueamos el error
        return []
    }
}

// === ACCIONES DE MUTACIÓN ===

export async function createInstance(data: any) {
    try {
        console.log('[SSR] Creating instance...')
        const res = await fetch(`${API_URL}/instances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY || ''
            },
            body: JSON.stringify(data)
        })

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
        return await res.json()
    } catch (error) {
        console.error('[SSR] Error creating instance:', error)
        throw error
    }
}

export async function deleteInstance(id: string) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        if (!res.ok) throw new Error(`Error deleting: ${res.status}`)
        return true
    } catch (error) {
        console.error('[SSR] Error deleting instance:', error)
        throw error
    }
}

export async function logoutInstance(id: string) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}/logout`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        if (!res.ok) throw new Error(`Error logging out: ${res.status}`)
        return true
    } catch (error) {
        console.error('[SSR] Error logging out:', error)
        throw error
    }
}

export async function connectInstance(id: string) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}/connect`, {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        if (!res.ok) throw new Error(`Error connecting: ${res.status}`)
        return true // La conexión devuelve el QR por sse o websocket normalmente, pero iniciamos el proceso
    } catch (error) {
        console.error('[SSR] Error connecting:', error)
        throw error
    }
}

export async function getInstanceQR(id: string) {
    try {
        // Obtenemos el QR como JSON { "code": "..." }
        const res = await fetch(`${API_URL}/instances/${id}/connect`, {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        if (!res.ok) throw new Error(`Error fetching QR: ${res.status}`)

        // Asumiendo que el endpoint devuelve el QR en la respuesta
        const data = await res.json()
        return data
    } catch (error) {
        console.error('[SSR] Error fetching QR:', error)
        throw error
    }
}

export async function updateInstance(id: string, payload: any) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY || ''
            },
            body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(`Error updating: ${res.status}`)
        return await res.json()
    } catch (error) {
        console.error('[SSR] Error updating instance:', error)
        throw error
    }
}

export async function getInstance(id: string) {
    try {
        console.log(`[SSR] Fetching instance ${id}`)
        // Usamos el listado y filtramos, o un endpoint de detalle si existe
        // Parece que la API usa listado general en el código original
        const res = await fetch(`${API_URL}/instances`, {
            headers: { 'X-API-Key': API_KEY || '', 'Cache-Control': 'no-cache' },
            next: { revalidate: 0 }
        })
        if (!res.ok) throw new Error('Error fetching instances')

        const json = await res.json()
        const instances = json.data || []
        const found = instances.find((i: any) => i.instance_id === id)

        if (!found) return null

        return {
            id: found.instance_id,
            name: found.name || found.instance_id,
            status: found.status,
            phone: found.jid ? found.jid.split('@')[0] : undefined,
            webhook_url: found.webhook_url,
            sync_history: found.sync_history
        }
    } catch (error) {
        console.error('[SSR] Error getting instance:', error)
        return null
    }
}

export async function getWebhookConfig(id: string) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}/webhook`, {
            headers: { 'X-API-Key': API_KEY || '' },
            next: { revalidate: 0 }
        })
        if (res.status === 404) return null
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return await res.json()
    } catch (error) {
        // Ignoramos errores de webhook no configurado
        return null
    }
}

export async function saveWebhookConfig(id: string, config: any) {
    try {
        const res = await fetch(`${API_URL}/instances/${id}/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY || '' },
            body: JSON.stringify(config)
        })
        if (!res.ok) throw new Error(`Error saving webhook: ${res.status}`)
        return await res.json()
    } catch (error) {
        console.error('[SSR] Error saving webhook:', error)
        throw error
    }
}
