'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
// NEW IMPORTS
import { getInstances } from '@/app/instances/actions'
import { getContacts, updateContact } from '@/app/crm/actions'

import { useAppStore } from '@/lib/store'
import { Search, Filter, User, Tag, Mail, Phone, Save, Loader2, ChevronDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CRMContact {
    jid: string
    name: string
    phone: string
    email?: string
    notes?: string
    tags?: string[]
    status: string
    last_contact_at?: string
}

export default function CRMPage() {
    const searchParams = useSearchParams()
    const instanceFromUrl = searchParams.get('instance')

    const [selectedInstance, setSelectedInstance] = useState<string>(instanceFromUrl || '')
    const [contacts, setContacts] = useState<CRMContact[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)

    const instances = useAppStore((state) => state.instances)
    const setInstances = useAppStore((state) => state.setInstances)

    // Cargar instancias al inicio usando SSR Action
    useEffect(() => {
        const loadInstances = async () => {
            try {
                const formatted = await getInstances()
                setInstances(formatted)

                // Si hay instancia en URL, usarla; si no, usar la primera
                if (instanceFromUrl) {
                    setSelectedInstance(instanceFromUrl)
                } else if (formatted.length > 0 && !selectedInstance) {
                    setSelectedInstance(formatted[0].id)
                }
            } catch (error) {
                console.error('Error loading instances:', error)
            }
        }
        loadInstances()
    }, [instanceFromUrl])

    // Cargar contactos cuando cambia la instancia usando SSR Action
    useEffect(() => {
        if (!selectedInstance) return

        const loadContacts = async () => {
            setLoading(true)
            try {
                const data = await getContacts(selectedInstance)
                setContacts(data || [])
            } catch (error) {
                console.error('Error loading contacts:', error)
                setContacts([])
            } finally {
                setLoading(false)
            }
        }
        loadContacts()
    }, [selectedInstance])

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedContact || !selectedInstance) return

        try {
            await updateContact(selectedInstance, selectedContact.jid, {
                name: selectedContact.name,
                email: selectedContact.email,
                notes: selectedContact.notes,
                tags: selectedContact.tags,
                status: selectedContact.status
            })

            // Actualizar lista local
            setContacts(contacts.map(c => c.jid === selectedContact.jid ? selectedContact : c))
            alert('Contacto actualizado correctamente')
        } catch (error) {
            console.error('Error updating contact:', error)
            alert('Error al actualizar contacto')
        }
    }

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden">
            {/* Sidebar - Lista de Contactos */}
            <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
                {/* Header Sidebar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="font-bold text-xl">CRM</Link>

                        {/* Selector de Instancia */}
                        <div className="relative">
                            <select
                                value={selectedInstance}
                                onChange={(e) => setSelectedInstance(e.target.value)}
                                className="appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {instances.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar contactos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                            <button
                                key={contact.jid}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800
                  ${selectedContact?.jid === contact.jid ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{contact.name || 'Sin nombre'}</h3>
                                    <p className="text-sm text-zinc-500 truncate">{contact.phone}</p>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {contact.tags?.map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center text-zinc-500">
                            <p>No hay contactos en esta instancia.</p>
                            <p className="text-xs mt-2">Los contactos se crearán automáticamente cuando interactúes con ellos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel Principal - Detalles del Contacto */}
            {selectedContact ? (
                <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black p-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedContact.name || selectedContact.phone}</h2>
                                        <p className="text-zinc-500 flex items-center gap-2 mt-1">
                                            <Phone className="w-4 h-4" /> {selectedContact.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium
                  ${selectedContact.status === 'lead' ? 'bg-yellow-100 text-yellow-700' :
                                        selectedContact.status === 'customer' ? 'bg-green-100 text-green-700' :
                                            'bg-zinc-100 text-zinc-600'}`}>
                                    {selectedContact.status || 'Nuevo'}
                                </div>
                            </div>

                            <form onSubmit={handleSaveContact} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={selectedContact.name}
                                            onChange={(e) => setSelectedContact({ ...selectedContact, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="email"
                                                value={selectedContact.email || ''}
                                                onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="ejemplo@correo.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Estado</label>
                                    <select
                                        value={selectedContact.status || 'lead'}
                                        onChange={(e) => setSelectedContact({ ...selectedContact, status: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="lead">Lead (Potencial)</option>
                                        <option value="customer">Cliente</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Etiquetas (separadas por coma)</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={selectedContact.tags?.join(', ') || ''}
                                            onChange={(e) => setSelectedContact({ ...selectedContact, tags: e.target.value.split(',').map(t => t.trim()) })}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="vip, nuevo, soporte..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notas Internas</label>
                                    <textarea
                                        rows={4}
                                        value={selectedContact.notes || ''}
                                        onChange={(e) => setSelectedContact({ ...selectedContact, notes: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="Escribe notas importantes sobre este contacto..."
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                    <User className="w-16 h-16 mb-4 opacity-20" />
                    <p>Selecciona un contacto para ver sus detalles</p>
                </div>
            )}
        </div>
    )
}
