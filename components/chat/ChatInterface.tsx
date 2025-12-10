'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Send, MoreVertical, Search, Paperclip, Smile, Loader2, Trash2, X, Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
// NEW IMPORTS
import { getChats, getChatHistory, sendMessageText, markChatAsRead, deleteChat } from '@/app/chat/actions'
import { requestNotificationPermission, showNotification, playNotificationSound, isPageVisible } from '@/lib/notifications'

interface ChatInterfaceProps {
    instanceId: string
}

interface Chat {
    jid: string
    name: string
    chat_type: string
    unread_count: number
    last_message_time: number
    last_message?: string
}

interface Message {
    id: string
    from: string
    to: string
    content: string
    timestamp: number
    is_from_me: boolean
    status: string
}

type ChatTab = 'all' | 'private' | 'group' | 'channel'

export default function ChatInterface({ instanceId }: ChatInterfaceProps) {
    const { activeChat, setActiveChat } = useAppStore()
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<ChatTab>('all')
    const [chats, setChats] = useState<Chat[]>([])
    const [filteredChats, setFilteredChats] = useState<Chat[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingChats, setLoadingChats] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [typingUsers, setTypingUsers] = useState<Record<string, number>>({})

    // Cargar chats usando Server Action
    const loadChats = async () => {
        setError(null)
        try {
            const data = await getChats(instanceId)
            setChats(data)
        } catch (error: any) {
            console.error('Error loading chats:', error)
            setError('Error de conexión o instancia no disponible')
        } finally {
            setLoadingChats(false)
        }
    }

    useEffect(() => {
        loadChats()
        // Polling básico cada 30s para refrescar lista de chats si el WS falla
        const interval = setInterval(loadChats, 30000)
        return () => clearInterval(interval)
    }, [instanceId])

    // Filtrar chats
    useEffect(() => {
        let filtered = chats
        if (activeTab !== 'all') {
            filtered = filtered.filter(chat => chat.chat_type === activeTab)
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(chat =>
                chat.name.toLowerCase().includes(query) ||
                chat.jid.includes(query)
            )
        }
        setFilteredChats(filtered)
    }, [searchQuery, chats, activeTab])

    // Cargar historial usando Server Action
    useEffect(() => {
        if (!activeChat) return

        const loadMessages = async () => {
            setLoadingMessages(true)
            try {
                const data = await getChatHistory(instanceId, activeChat)
                setMessages(data)
            } catch (error) {
                console.error('Error loading history:', error)
            } finally {
                setLoadingMessages(false)
            }
        }
        loadMessages()
    }, [activeChat, instanceId])

    // Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // WebSocket (Cliente -> Backend directo, puede fallar por Mixed Content/Scope si no está expuesto)
    // Se mantiene como "Best Effort"
    useEffect(() => {
        // Intentar conectar a localhost:8080 o lo que esté en ENV
        // Nota: Esto fallará si el usuario no tiene acceso directo al puerto 8080 del servidor.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const wsUrl = apiUrl.replace(/^http/, 'ws') + `/instances/${instanceId}/ws`

        let ws: WebSocket
        try {
            ws = new WebSocket(wsUrl)
            ws.onopen = () => console.log('WS Connected')
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    if (message.type === 'message' && message.payload?.data) {
                        const eventData = message.payload.data
                        const newMsg: Message = {
                            id: eventData.message_id,
                            from: eventData.from,
                            to: eventData.to,
                            content: eventData.text || eventData.caption || `[${eventData.message_type}]`,
                            timestamp: eventData.timestamp || Date.now() / 1000,
                            is_from_me: eventData.is_from_me,
                            status: 'received'
                        }

                        if (!newMsg.is_from_me && soundEnabled) playNotificationSound()

                        // Update current chat messages
                        if (activeChat && (newMsg.to === activeChat || newMsg.from === activeChat)) {
                            setMessages(prev => {
                                if (prev.some(m => m.id === newMsg.id)) return prev
                                return [...prev, newMsg]
                            })
                        }
                        // Reload chats to update last message
                        loadChats()
                    }
                } catch (e) { }
            }
        } catch (e) {
            console.log('WS connection failed (expected if behind firewall/docker network issues)')
        }

        return () => {
            if (ws) ws.close()
        }
    }, [instanceId, activeChat])

    // Marcar como leído
    useEffect(() => {
        if (activeChat && instanceId) {
            markChatAsRead(instanceId, activeChat).then(() => {
                setChats(prev => prev.map(chat => {
                    if (chat.jid === activeChat) return { ...chat, unread_count: 0 }
                    return chat
                }))
            })
        }
    }, [activeChat, instanceId])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!messageInput.trim() || !activeChat) return

        setSending(true)
        try {
            const phone = activeChat.split('@')[0]
            const response = await sendMessageText(instanceId, {
                phone: phone,
                message: messageInput
            })

            const newMessage: Message = {
                id: response.message_id || Date.now().toString(),
                from: 'me',
                to: activeChat,
                content: messageInput,
                timestamp: Date.now() / 1000,
                is_from_me: true,
                status: 'sent'
            }
            setMessages(prev => [...prev, newMessage])
            setMessageInput('')
            loadChats()
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Error enviando mensaje')
        } finally {
            setSending(false)
        }
    }

    const handleDeleteChat = async () => {
        if (!activeChat) return
        try {
            await deleteChat(instanceId, activeChat)
            setChats(prev => prev.filter(c => c.jid !== activeChat))
            setActiveChat(null)
            setMessages([])
            setShowDeleteConfirm(false)
        } catch (error) {
            console.error('Error deleting chat:', error)
            alert('Error al eliminar chat')
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (filteredChats.length === 0 && searchQuery.match(/^\d+$/)) {
            const newJid = `${searchQuery}@s.whatsapp.net`
            setActiveChat(newJid)
            setMessages([])
            setSearchQuery('')
        } else if (filteredChats.length > 0) {
            setActiveChat(filteredChats[0].jid)
            setSearchQuery('')
        }
    }

    const formatTime = (timestamp: number) => {
        try {
            return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return ''
        }
    }

    const truncate = (text: string, length = 30) =>
        text && text.length > length ? text.slice(0, length) + "..." : text || '';

    return (
        <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Sidebar - Lista de Chats */}
            <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar o nuevo chat (número)..."
                            className="w-full pl-10 pr-10 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>

                    {/* Controles de notificaciones */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${notificationsEnabled
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}
                            title={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                        >
                            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            <span className="hidden sm:inline">Notif.</span>
                        </button>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${soundEnabled
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                }`}
                            title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            <span className="hidden sm:inline">Sonido</span>
                        </button>
                    </div>
                </div>

                {/* Pestañas de filtrado */}
                <div className="px-2 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex gap-1">
                        {[
                            { id: 'all' as ChatTab, label: 'Todos', icon: '💬' },
                            { id: 'private' as ChatTab, label: 'Privados', icon: '👤' },
                            { id: 'group' as ChatTab, label: 'Grupos', icon: '👥' },
                            { id: 'channel' as ChatTab, label: 'Canales', icon: '📢' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <span className="mr-1">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {error ? (
                        <div className="p-4 text-center">
                            <p className="text-red-500 text-sm mb-2">{error}</p>
                            <button
                                onClick={loadChats}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : loadingChats ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-sm">
                            {searchQuery.match(/^\d+$/) ? (
                                <div>
                                    <p>No se encontró el chat</p>
                                    <p className="text-xs mt-1">Presiona Enter para abrir nuevo chat</p>
                                </div>
                            ) : (
                                'No hay chats disponibles'
                            )}
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <button
                                key={chat.jid}
                                onClick={() => {
                                    setActiveChat(chat.jid)
                                    setSearchQuery('')
                                }}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800/50
                ${activeChat === chat.jid ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <div className="relative w-12 h-12 shrink-0">
                                    <div className="w-full h-full rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-medium">
                                        {chat.name?.[0] || '?'}
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-medium truncate ${chat.unread_count > 0 ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                            {chat.name || chat.jid.split('@')[0]}
                                        </h3>
                                        {chat.last_message_time > 0 && (
                                            <span className={`text-xs ${chat.unread_count > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}`}>
                                                {formatTime(chat.last_message_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate ${typingUsers[chat.jid]
                                            ? 'text-green-600 dark:text-green-400 font-medium italic'
                                            : chat.unread_count > 0
                                                ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                                                : 'text-zinc-500'
                                            }`}>
                                            {typingUsers[chat.jid]
                                                ? 'Escribiendo...'
                                                : truncate(chat.last_message || "Mensaje", 35)}
                                        </p>
                                        {chat.unread_count > 0 && (
                                            <div className="ml-2 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">
                                                {chat.unread_count}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Área de Chat */}
            <div className="flex-1 flex flex-col bg-white dark:bg-black min-w-0">
                {activeChat ? (
                    <>
                        {/* Header del Chat */}
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center">
                                    {chats.find(c => c.jid === activeChat)?.name?.[0] || activeChat.split('@')[0][0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-medium">{chats.find(c => c.jid === activeChat)?.name || activeChat.split('@')[0]}</h3>
                                    <p className={`text-xs ${typingUsers[activeChat] ? 'text-green-600 dark:text-green-400 font-medium italic animate-pulse' : 'text-zinc-500'}`}>
                                        {typingUsers[activeChat] ? 'Escribiendo...' : activeChat}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-600 transition-colors"
                                    title="Eliminar chat"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                                    <MoreVertical className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Confirmación de eliminación */}
                        {showDeleteConfirm && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3 flex items-center justify-between">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ¿Eliminar esta conversación? Esta acción no se puede deshacer.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteChat}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-sm rounded"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Mensajes */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-zinc-50/50 dark:bg-black">
                            {loadingMessages ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                    <p>No hay mensajes en el historial</p>
                                    <p className="text-xs mt-1">Envía un mensaje para comenzar</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.is_from_me ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 break-words overflow-wrap-anywhere ${msg.is_from_me
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                            <span className={`text-[10px] mt-1 block text-right ${msg.is_from_me ? 'text-blue-100' : 'text-zinc-400'
                                                }`}>
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                                    <Smile className="w-6 h-6" />
                                </button>
                                <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                                    <Paperclip className="w-6 h-6" />
                                </button>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || sending}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-full transition-colors"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 opacity-20" />
                        </div>
                        <p>Selecciona un chat para comenzar</p>
                        <p className="text-xs mt-1">O busca un número para abrir un nuevo chat</p>
                    </div>
                )}
            </div>
        </div>
    )
}
