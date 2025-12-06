'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Terminal } from 'lucide-react'

interface ApiCheatSheetModalProps {
    isOpen: boolean
    onClose: () => void
    instanceId: string
}

export default function ApiCheatSheetModal({ isOpen, onClose, instanceId }: ApiCheatSheetModalProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState<string>('')

    // Leer API Key al montar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedKey = localStorage.getItem('kero_api_key')
            if (storedKey) setApiKey(storedKey)
        }
    }, [])

    if (!isOpen) return null

    const baseUrl = typeof window !== 'undefined' ? window.location.origin.replace('3000', '8080') : 'http://localhost:8080'

    const endpoints = [
        {
            id: 'status',
            title: 'Verificar Estado',
            method: 'GET',
            url: `/instances/${instanceId}/status`,
            body: null,
            description: 'Obtiene el estado actual de la conexión (connected, disconnected, etc).'
        },
        {
            id: 'connect',
            title: 'Conectar Instancia',
            method: 'POST',
            url: `/instances/${instanceId}/connect`,
            body: null,
            description: 'Inicia el proceso de conexión y generación de QR.'
        },
        {
            id: 'disconnect',
            title: 'Desconectar Instancia',
            method: 'POST',
            url: `/instances/${instanceId}/disconnect`,
            body: null,
            description: 'Cierra la sesión de WhatsApp.'
        },
        {
            id: 'send-text',
            title: 'Enviar Mensaje de Texto',
            method: 'POST',
            url: `/instances/${instanceId}/messages/send`,
            body: {
                to: "5215512345678@s.whatsapp.net",
                type: "text",
                content: {
                    text: "Hola mundo desde Kero-Kero API! 🐸"
                }
            },
            description: 'Envía un mensaje de texto simple.'
        },
        {
            id: 'send-image',
            title: 'Enviar Imagen',
            method: 'POST',
            url: `/instances/${instanceId}/messages/send`,
            body: {
                to: "5215512345678@s.whatsapp.net",
                type: "image",
                content: {
                    image: {
                        url: "https://example.com/image.png",
                        caption: "Mira esta imagen!"
                    }
                }
            },
            description: 'Envía una imagen desde una URL.'
        },
        {
            id: 'contacts',
            title: 'Obtener Contactos',
            method: 'GET',
            url: `/instances/${instanceId}/contacts`,
            body: null,
            description: 'Recupera la lista de contactos sincronizados.'
        }
    ]

    const generateCurl = (endpoint: any) => {
        let curl = `curl -X ${endpoint.method} "${baseUrl}${endpoint.url}" \\
  -H "X-API-Key: ${apiKey || 'TU_API_KEY'}"`

        if (endpoint.body) {
            curl += ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.body, null, 2)}'`
        }

        return curl
    }

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Terminal className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">API Cheat Sheet</h2>
                            <p className="text-sm text-zinc-500">Comandos listos para usar con tu instancia <span className="font-mono text-zinc-700 dark:text-zinc-300">{instanceId}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {endpoints.map((endpoint) => {
                        const curlCommand = generateCurl(endpoint)

                        return (
                            <div key={endpoint.id} className="space-y-3">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase
                                            ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                endpoint.method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-orange-100 text-orange-700'}`}>
                                            {endpoint.method}
                                        </span>
                                        {endpoint.title}
                                    </h3>
                                    <span className="text-sm text-zinc-500">{endpoint.description}</span>
                                </div>

                                <div className="relative group">
                                    <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-sm font-mono overflow-x-auto border border-zinc-800">
                                        <code>{curlCommand}</code>
                                    </pre>
                                    <button
                                        onClick={() => handleCopy(endpoint.id, curlCommand)}
                                        className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-zinc-700"
                                        title="Copiar comando"
                                    >
                                        {copiedId === endpoint.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
