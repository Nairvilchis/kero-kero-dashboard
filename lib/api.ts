import axios from 'axios'

// Obtener configuración desde localStorage (se actualiza en el login)
const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('kero_api_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
}

const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        // Obtener JWT token del localStorage
        const jwtToken = localStorage.getItem('kero_jwt_token')
        if (jwtToken) {
            return jwtToken
        }
    }
    return ''
}

export const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
})

// Interceptor de request para agregar el token JWT en cada petición
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken()
        if (token) {
            // Usar Authorization Bearer con JWT
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Interceptor de response para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si es un error 401, el token puede haber expirado
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Limpiar tokens y redirigir al login
                localStorage.removeItem('kero_jwt_token')
                localStorage.removeItem('kero_jwt_expires')
                localStorage.removeItem('kero_api_key')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export const instancesApi = {
    list: () => api.get('/instances'),
    update: (id: string, data: { name?: string; webhook_url?: string; sync_history?: boolean }) => api.put(`/instances/${id}`, data),
    create: (data: { id: string; webhook_url?: string; sync_history?: boolean }) => api.post('/instances', {
        instance_id: data.id,
        webhook_url: data.webhook_url,
        sync_history: data.sync_history
    }),
    delete: (id: string) => api.delete(`/instances/${id}`),
    connect: (id: string) => api.post(`/instances/${id}/connect`),
    qr: (id: string) => api.get(`/instances/${id}/qr`),
    logout: (id: string) => api.post(`/instances/${id}/disconnect`),
}

export const crmApi = {
    list: (instanceId: string) => api.get(`/instances/${instanceId}/crm/contacts`),
    get: (instanceId: string, jid: string) => api.get(`/instances/${instanceId}/crm/contacts/${jid}`),
    update: (instanceId: string, jid: string, data: any) => api.put(`/instances/${instanceId}/crm/contacts/${jid}`, data),
}

export const messagesApi = {
    sendText: (instanceId: string, data: { phone: string; message: string }) => api.post(`/instances/${instanceId}/messages/text`, data),
    sendImage: (instanceId: string, data: any) => api.post(`/instances/${instanceId}/messages/image`, data),
    sendVideo: (instanceId: string, data: any) => api.post(`/instances/${instanceId}/messages/video`, data),
    sendAudio: (instanceId: string, data: any) => api.post(`/instances/${instanceId}/messages/audio`, data),
    sendDocument: (instanceId: string, data: any) => api.post(`/instances/${instanceId}/messages/document`, data),
    sendLocation: (instanceId: string, data: any) => api.post(`/instances/${instanceId}/messages/location`, data),
}

export const chatsApi = {
    list: (instanceId: string) => api.get(`/instances/${instanceId}/chats`),
    getHistory: (instanceId: string, jid: string) => api.get(`/instances/${instanceId}/chats/${jid}/messages`),
    delete: (instanceId: string, jid: string) => api.delete(`/instances/${instanceId}/chats/${jid}`),
    archive: (instanceId: string, jid: string, archive: boolean) => api.post(`/instances/${instanceId}/chats/archive`, { jid, archive }),
    updateStatus: (instanceId: string, jid: string, status: string) => api.post(`/instances/${instanceId}/chats/status`, { jid, status }),
    markAsRead: (instanceId: string, jid: string) => api.post(`/instances/${instanceId}/chats/${jid}/read`),
}

export const syncApi = {
    start: (instanceId: string, options: { messages_per_chat?: number; max_chats?: number; advanced?: boolean }) => api.post(`/instances/${instanceId}/sync`, options),
    getProgress: (instanceId: string) => api.get(`/instances/${instanceId}/sync/progress`),
    cancel: (instanceId: string) => api.delete(`/instances/${instanceId}/sync`),
}

export const contactsApi = {
    check: (instanceId: string, phones: string[]) => api.post(`/instances/${instanceId}/contacts/check`, { phones }),
    block: (instanceId: string, jid: string) => api.post(`/instances/${instanceId}/contacts/block`, { jid }),
    unblock: (instanceId: string, jid: string) => api.post(`/instances/${instanceId}/contacts/unblock`, { jid }),
    getProfilePicture: (instanceId: string, jid: string) => api.get(`/instances/${instanceId}/contacts/profile-picture`, { params: { jid } }),
}

export const webhookApi = {
    get: (instanceId: string) => api.get(`/instances/${instanceId}/webhook`),
    set: (instanceId: string, config: { url: string; events: string[]; secret?: string; enabled: boolean }) =>
        api.post(`/instances/${instanceId}/webhook`, config),
    delete: (instanceId: string) => api.delete(`/instances/${instanceId}/webhook`),
}
