'use server'

const API_URL = process.env.INTERNAL_API_URL || 'http://kero-server:8080'
const API_KEY = process.env.API_KEY

export async function getContacts(instanceId: string) {
    if (!instanceId) return []

    try {
        console.log(`[SSR] Fetching contacts for instance ${instanceId}`)
        const res = await fetch(`${API_URL}/instances/${instanceId}/crm/contacts`, {
            headers: {
                'X-API-Key': API_KEY || '',
                'Cache-Control': 'no-cache'
            },
            next: { revalidate: 10 } // Cache por 10 segundos
        })

        if (!res.ok) {
            if (res.status === 404) return []
            throw new Error(`Error fetching contacts: ${res.status}`)
        }

        const json = await res.json()
        return json.data || [] // Asumiendo estructura standar { data: [...] }
    } catch (error) {
        console.error('[SSR] Error getting contacts:', error)
        return []
    }
}

export async function updateContact(instanceId: string, jid: string, data: any) {
    try {
        const res = await fetch(`${API_URL}/instances/${instanceId}/crm/contacts/${jid}`, {
            method: 'PUT', // o PATCH, depende de tu API
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY || ''
            },
            body: JSON.stringify(data)
        })

        if (!res.ok) throw new Error(`Error updating contact: ${res.status}`)
        return await res.json()
    } catch (error) {
        console.error('[SSR] Error updating contact:', error)
        throw error
    }
}
