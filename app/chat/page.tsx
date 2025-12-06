'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Send, MoreVertical, Phone, Video, Search, ArrowLeft, Paperclip } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
    const searchParams = useSearchParams()
    const instanceId = searchParams.get('instance')

    const { messages, activeChat, addMessage, setActiveChat } = useAppStore()
    const [messageInput, setMessageInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Si no hay instancia seleccionada, mostrar error o redirigir
    if (!instanceId) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Instancia no seleccionada</h2>
                    <p className="text-zinc-500 mb-4">Por favor selecciona una instancia desde el dashboard.</p>
                    <Link href="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
                </div>
            </div>
        )
    }

    // Mock chats para la demo
    const chats = [
        { jid: '5215512345678@s.whatsapp.net', name: 'Juan Pérez', lastMessage: 'Hola, ¿cómo estás?', unreadCount: 2 },
        { jid: '5215587654321@s.whatsapp.net', name: 'María García', lastMessage: 'Te envié el archivo', unreadCount: 0 },
    ]

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!messageInput.trim() || !activeChat) return

        // Aquí iría la lógica para enviar mensaje al backend
        console.log('Sending message to', activeChat, ':', messageInput)

        // Simular mensaje enviado en UI
        useAppStore.getState().addMessage(activeChat, {
            id: Date.now().toString(),
            from: 'me',
            to: activeChat,
            text: messageInput,
            type: 'text',
            timestamp: Date.now(),
            isFromMe: true
        })

        setMessageInput('')
    }

    return (
        <div className="flex h-screen bg-white dark:bg-black overflow-hidden">
            {/* Sidebar - Lista de Chats */}
            <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/" className="font-bold text-lg">Kero-Kero</Link>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                                <MoreVertical className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar chat..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat) => (
                        <button
                            key={chat.jid}
                            onClick={() => setActiveChat(chat.jid)}
                            className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left
                ${activeChat === chat.jid ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-medium">
                                {chat.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-medium truncate">{chat.name}</h3>
                                    <span className="text-xs text-zinc-500">10:30</span>
                                </div>
                                <p className="text-sm text-zinc-500 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                                    {chat.unreadCount}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Área Principal - Chat */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
                    {/* Header del Chat */}
                    <div className="h-16 px-4 flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center">
                                J
                            </div>
                            <div>
                                <h2 className="font-medium">Juan Pérez</h2>
                                <p className="text-xs text-zinc-500">en línea</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-zinc-500">
                            <button><Video className="w-5 h-5" /></button>
                            <button><Phone className="w-5 h-5" /></button>
                            <button><Search className="w-5 h-5" /></button>
                            <button><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {(messages[activeChat] || []).map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 shadow-sm
                    ${msg.isFromMe
                                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-black dark:text-white rounded-tr-none'
                                            : 'bg-white dark:bg-[#202c33] text-black dark:text-white rounded-tl-none'}`}
                                >
                                    <p>{msg.text}</p>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block text-right mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2">
                        <button className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Escribe un mensaje"
                                className="flex-1 px-4 py-2 rounded-lg border-none focus:ring-0 bg-white dark:bg-zinc-700"
                            />
                            <button
                                type="submit"
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-b-8 border-green-500 text-center p-8">
                    <h1 className="text-3xl font-light text-zinc-600 dark:text-zinc-300 mb-4">Kero-Kero Web</h1>
                    <p className="text-zinc-500 max-w-md">
                        Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.
                        Usa Kero-Kero en hasta 4 dispositivos vinculados y 1 teléfono a la vez.
                    </p>
                </div>
            )}
        </div>
    )
}
