import { useAppStore } from './store'

type WebSocketEvent = {
    type: string
    payload: any
}

class WebSocketClient {
    private ws: WebSocket | null = null
    private url: string
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5

    constructor(url: string) {
        this.url = url
    }

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return

        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
            console.log('WebSocket connected')
            this.reconnectAttempts = 0
        }

        this.ws.onmessage = (event) => {
            try {
                const message: WebSocketEvent = JSON.parse(event.data)
                this.handleMessage(message)
            } catch (error) {
                console.error('Error parsing WebSocket message:', error)
            }
        }

        this.ws.onclose = () => {
            console.log('WebSocket disconnected')
            this.handleReconnect()
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => this.connect(), 3000 * this.reconnectAttempts)
        }
    }

    private handleMessage(message: WebSocketEvent) {
        const store = useAppStore.getState()

        switch (message.type) {
            case 'status':
                store.updateInstanceStatus(message.payload.instance_id, message.payload.status)
                break
            case 'qr':
                // Manejado localmente en el componente si es necesario, 
                // o podríamos actualizar el store si tuviéramos un campo QR
                break
            case 'message':
                const msgData = message.payload.data
                const chatJID = msgData.is_group ? msgData.to : msgData.from

                store.addMessage(chatJID, {
                    id: msgData.message_id,
                    from: msgData.from,
                    to: msgData.to,
                    text: msgData.text || msgData.caption,
                    type: msgData.message_type,
                    timestamp: Date.now(), // El payload debería traer timestamp
                    isFromMe: false
                })
                break
        }
    }
}

export const wsClient = new WebSocketClient('ws://localhost:8080/ws')
