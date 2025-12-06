import { create } from 'zustand'

interface Instance {
    id: string
    name: string
    status: 'connected' | 'disconnected' | 'connecting'
    phone?: string
}

interface Message {
    id: string
    from: string
    to: string
    text?: string
    type: string
    timestamp: number
    isFromMe: boolean
}

interface Chat {
    jid: string
    name?: string
    lastMessage?: Message
    unreadCount: number
}

interface AppState {
    instances: Instance[]
    messages: Record<string, Message[]> // key: chatJID
    chats: Chat[]
    activeChat: string | null

    setInstances: (instances: Instance[]) => void
    addInstance: (instance: Instance) => void
    removeInstance: (id: string) => void
    updateInstanceStatus: (id: string, status: Instance['status']) => void

    addMessage: (chatJID: string, message: Message) => void
    setActiveChat: (chatJID: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
    instances: [],
    messages: {},
    chats: [],
    activeChat: null,

    setInstances: (instances) => set({ instances }),
    addInstance: (instance) =>
        set((state) => ({ instances: [...state.instances, instance] })),
    removeInstance: (id) =>
        set((state) => ({
            instances: state.instances.filter((inst) => inst.id !== id),
        })),
    updateInstanceStatus: (id, status) =>
        set((state) => ({
            instances: state.instances.map((inst) =>
                inst.id === id ? { ...inst, status } : inst
            ),
        })),

    addMessage: (chatJID, message) =>
        set((state) => {
            const chatMessages = state.messages[chatJID] || []
            return {
                messages: {
                    ...state.messages,
                    [chatJID]: [...chatMessages, message],
                },
            }
        }),

    setActiveChat: (chatJID) => set({ activeChat: chatJID }),
}))
