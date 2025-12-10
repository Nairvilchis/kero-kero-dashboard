'use server'

const API_URL = process.env.INTERNAL_API_URL || 'http://kero-server:8080'
const API_KEY = process.env.API_KEY

export async function getChats(instanceId: string) {
    if (!instanceId) return []
    try {
        const res = await fetch(`${API_URL}/instances/${instanceId}/chats`, {
            headers: { 'X-API-Key': API_KEY || '', 'Cache-Control': 'no-cache' },
            next: { revalidate: 2 } // Cache muy corto para chat
        })
        if (!res.ok) {
            if (res.status === 404) return []
            throw new Error(`Error fetching chats: ${res.status}`)
        }
        const json = await res.json()
        return json.data || []
    } catch (error) {
        console.error('[SSR] Error fetching chats:', error)
        return []
    }
}

export async function getChatHistory(instanceId: string, jid: string) {
    if (!instanceId || !jid) return []
    try {
        const res = await fetch(`${API_URL}/instances/${instanceId}/chats/${jid}/messages`, {
            headers: { 'X-API-Key': API_KEY || '', 'Cache-Control': 'no-cache' },
            next: { revalidate: 0 }
        })
        if (!res.ok) {
            if (res.status === 404) return []
            throw new Error(`Error fetching history: ${res.status}`)
        }
        const json = await res.json()
        return json.data || []
    } catch (error) {
        console.error('[SSR] Error fetching history:', error)
        return []
    }
}

export async function sendMessageText(instanceId: string, data: { phone: string; message: string }) {
    try {
        const res = await fetch(`${API_URL}/instances/${instanceId}/messages/text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY || ''
            },
            body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error(`Error sending message: ${res.status}`)
        return await res.json()
    } catch (error) {
        console.error('[SSR] Error sending message:', error)
        throw error
    }
}

export async function deleteChat(instanceId: string, jid: string) {
    try {
        await fetch(`${API_URL}/instances/${instanceId}/chats/${jid}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        return true
    } catch (error) {
        console.error('[SSR] Error deleting chat:', error)
        throw error
    }
}

export async function markChatAsRead(instanceId: string, jid: string) {
    try {
        await fetch(`${API_URL}/instances/${instanceId}/chats/${jid}/read`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY || '' }
        })
        return true
    } catch (error) {
        console.error('[SSR] Error marking read:', error)
        return false // No lanzamos error para no bloquear la UI
    }
}

export async function archiveChat(instanceId: string, jid: string, archive: boolean) {
    try {
        await fetch(`${API_URL}/instances/${instanceId}/chats/archive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY || '' },
            body: JSON.stringify({ jid, archive })
        })
        return true
    } catch (error) {
        console.error('[SSR] Error archiving:', error)
        return false
    }
}
