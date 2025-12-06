'use client'

import { useEffect } from 'react'
import { wsClient } from '@/lib/websocket'

export default function WebSocketInitializer() {
    useEffect(() => {
        // WebSocket connections are handled per-instance, not globally
        // wsClient.connect()
    }, [])

    return null
}
