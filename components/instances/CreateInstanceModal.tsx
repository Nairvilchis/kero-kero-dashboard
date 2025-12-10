'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createInstance } from '@/app/instances/actions'
import { useAppStore } from '@/lib/store'
import { Loader2, X } from 'lucide-react'

const schema = z.object({
    id: z.string().min(3, 'El ID debe tener al menos 3 caracteres').regex(/^[a-z0-9-_]+$/, 'Solo letras minúsculas, números, guiones y guiones bajos'),
    webhook_url: z.string().url('Debe ser una URL válida (http/https)').optional().or(z.literal('')),
    sync_history: z.boolean().default(false)
})

type FormData = z.infer<typeof schema>

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function CreateInstanceModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const addInstance = useAppStore((state) => state.addInstance)
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            sync_history: false // Ensure default value for checkbox
        }
    })

    if (!isOpen) return null

    const onSubmit = async (data: FormData) => {
        setLoading(true)
        try {
            await createInstance(data)
            // Ya no dependemos de la respuesta directa para actualizar el store si usamos revalidatePath en la action
            // Pero como estamos en client, podemos forzar un refresh o añadir optimísticamente
            // window.location.reload() // Recarga simple para obtener la lista actualizada desde el servidor
            addInstance({
                id: data.id,
                name: data.id,
                status: 'disconnected'
            })
            reset()
            onClose()
        } catch (error) {
            console.error('Error creating instance:', error)
            alert('Error al crear la instancia. Verifica que el ID no exista.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold">Nueva Instancia</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">ID de Instancia</label>
                        <input
                            {...register('id', {
                                required: 'El ID es requerido',
                                pattern: {
                                    value: /^[a-z0-9-_]+$/,
                                    message: 'Solo letras minúsculas, números, guiones y guiones bajos'
                                }
                            })}
                            placeholder="ej. mi-empresa-01"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Webhook URL (Opcional)</label>
                        <input
                            {...register('webhook_url', {
                                pattern: {
                                    value: /^https?:\/\/.+/,
                                    message: 'Debe ser una URL válida (http/https)'
                                }
                            })}
                            placeholder="https://mi-api.com/webhook"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        {errors.webhook_url && <p className="text-red-500 text-xs mt-1">{errors.webhook_url.message}</p>}
                    </div>

                    <div>
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="sync_history"
                                {...register('sync_history')}
                                className="mt-1 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-transparent"
                            />
                            <div>
                                <label htmlFor="sync_history" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                    Sincronizar historial de mensajes
                                </label>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Si se activa, se guardarán los mensajes recientes al conectar la instancia.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Crear Instancia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
