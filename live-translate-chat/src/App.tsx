import { useEffect, useRef, useState } from 'react'
import './App.css'
/*import ChatHeader from './ChatHeader'
*/import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { HubConnectionBuilder } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'
import type {MessageData } from './types'

type ApiMessage = {
    id: number
    message: string
    translatedText: string
    translatedLanguage: string
    userId: number
    conversationId: number
    timestamp: string
    isDelivered: boolean
    isRead: boolean
}

function App() {

    const [messages, setMessages] = useState < MessageData[]>([])
    const [error, setError] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [users, setUsers] = useState<{
    id: number
    name: string
    favouriteLanguage: string
}[]>([])
    const [selectedUserId, setSelectedUserId] = useState<number>(1)
    const [conversations, setConversations] = useState<
        { id: number; firstUserId: number; secondUserId: number }[]
    >([])
    const [selectedConversationId, setSelectedConversationId] = useState<number>(1)
    const [typingUser, setTypingUser] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const connectionRef = useRef<HubConnection | null>(null)

    const selectedUserIdRef = useRef(selectedUserId)
    const selectedConversationIdRef = useRef(selectedConversationId)
    const joinedConversationIdRef = useRef<number | null>(null)
    const connectionReadyRef = useRef<Promise<void> | null>(null)
    const groupChangeQueueRef = useRef<Promise<void>>(Promise.resolve())

    const readMessageIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        selectedUserIdRef.current = selectedUserId
        selectedConversationIdRef.current = selectedConversationId
    }, [selectedUserId, selectedConversationId])

    function updateSignalRGroup() {
        groupChangeQueueRef.current = groupChangeQueueRef.current
            .then(async () => {
                const connection = connectionRef.current

                if (!connection || !connectionReadyRef.current) {
                    return
                }

                await connectionReadyRef.current

                if (connection.state !== 'Connected') {
                    return
                }

                const conversationId = selectedConversationIdRef.current
                const userId = selectedUserIdRef.current

                if (joinedConversationIdRef.current !== conversationId) {
                    if (joinedConversationIdRef.current !== null) {
                        await connection.invoke(
                            'LeaveConversation',
                            joinedConversationIdRef.current
                        )
                    }

                    joinedConversationIdRef.current = null

                    if (conversationId > 0) {
                        await connection.invoke(
                            'JoinConversation',
                            conversationId,
                            userId
                        )

                        joinedConversationIdRef.current = conversationId
                    }
                }

                if (conversationId > 0) {
                    await connection.invoke(
                        'MarkMessagesAsRead',
                        conversationId,
                        userId
                    )
                }
            })
            .catch(err => {
                console.error('Erreur de gestion des groupes SignalR :', err)
            })

        return groupChangeQueueRef.current
    }

    useEffect(() => {
        let cancelled = false
        async function loadConversations() {
            try {
                const response = await fetch('http://localhost:5009/Conversations')

                if (!response.ok) {
                    throw new Error('Impossible de charger les conversations.')
                }

                const results = await response.json()

                setConversations(results.map((conversation: {
                    id: number
                    firstUserId: number
                    secondUserId: number
                }) => ({
                    id: conversation.id,
                    firstUserId: conversation.firstUserId,
                    secondUserId: conversation.secondUserId
                })))
            } catch (err) {
                console.error('Erreur de chargement des conversations :', err)
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('http://localhost:5009/Users')

                if (!response.ok) {
                    throw new Error('Impossible de charger les utilisateurs.')
                }

                const results = await response.json()

                setUsers(results.map((item: {
                    id: number
                    name: string
                    favouriteLanguage: string
                }) => ({
                    id: item.id,
                    name: item.name,
                    favouriteLanguage: item.favouriteLanguage
                })))
            } catch (err) {
                console.error('Erreur de chargement des utilisateurs :', err)
            }
        }

        loadUsers()
        loadConversations()

        async function loadMessages() {
            try {
                const response = await fetch(
                    `http://localhost:5009/ChatMessages?userId=${selectedUserId}&conversationId=${selectedConversationId}`
                )

                if (!response.ok) {
                    throw new Error(`Erreur API : ${response.status}`)
                }

                const results: ApiMessage[] = await response.json()
                if (cancelled) return
                const conversationMessages = results
                    .filter(message => message.conversationId === selectedConversationId)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                setMessages(conversationMessages.map((result) => ({
                    id: String(result.id),
                    text: result.message,
                    translatedText: result.translatedText,
                    translatedLanguage: result.translatedLanguage,
                    isMine: result.userId === selectedUserId,
                    isDelivered: result.isDelivered,
                    isRead: result.isRead,
                    sentAt: new Date(result.timestamp)
                })))
            } catch (err) {
                if (cancelled) return

                console.error('Erreur de chargement des messages :', err)
                setError('Impossible de charger les anciens messages.')
            }
        }

        loadMessages()
        return () => {
            cancelled = true
        }
    }, [selectedConversationId, selectedUserId])


    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl('http://localhost:5009/chatHub')
            .withAutomaticReconnect()
            .build()

        connectionRef.current = connection

        connection.on('ReceiveMessage', async (conversationId: number) => {
            const userId = selectedUserIdRef.current

            if (conversationId !== selectedConversationIdRef.current) {
                return
            }

            try {
                const response = await fetch(
                    `http://localhost:5009/ChatMessages?userId=${userId}&conversationId=${conversationId}`
                )

                if (!response.ok) {
                    throw new Error(`Erreur API : ${response.status}`)
                }

                const results: ApiMessage[] = await response.json()

                // Vérifier que le profil et la conversation n'ont pas changé
                if (
                    conversationId !== selectedConversationIdRef.current ||
                    userId !== selectedUserIdRef.current
                ) {
                    return
                }

                setMessages(results
                    .sort((a, b) =>
                        new Date(a.timestamp).getTime() -
                        new Date(b.timestamp).getTime()
                    )
                    .map(result => ({
                        id: String(result.id),
                        text: result.message,
                        translatedText: result.translatedText,
                        translatedLanguage: result.translatedLanguage,
                        isMine: result.userId === userId,
                        isDelivered: result.isDelivered,
                        isRead: result.isRead,
                        sentAt: new Date(result.timestamp)
                    }))
                )

                await connection.invoke(
                    'MarkMessagesAsRead',
                    conversationId,
                    userId
                )
            } catch (err) {
                console.error('Erreur de réception des messages :', err)
            }
        })

        connection.on(
            'MessagesRead',
            (conversationId: number, _userId: number, messageIds: number[]) => {
                if (conversationId !== selectedConversationIdRef.current) {
                    return
                }

                const readIds = new Set(messageIds.map(id => String(id)))

                readIds.forEach(id => readMessageIdsRef.current.add(id))

                setMessages(previousMessages =>
                    previousMessages.map(message =>
                        readIds.has(message.id)
                            ? { ...message, isDelivered: true, isRead: true }
                            : message
                    )
                )
            }
        )

        connection.on(
            'UserTyping',
            (conversationId: number, userName: string) => {
                if (conversationId === selectedConversationIdRef.current) {
                    setTypingUser(userName)
                    setIsTyping(true)
                }
            }
        )

        connection.on(
            'UserStoppedTyping',
            (conversationId: number) => {
                if (conversationId === selectedConversationIdRef.current) {
                    setTypingUser('')
                    setIsTyping(false)
                }
            }
        )

        // Les groupes SignalR sont perdus après une reconnexion.
        // Il faut donc rejoindre la conversation active.
        connection.onreconnected(async () => {
            joinedConversationIdRef.current = null
            await updateSignalRGroup()
        })

        connectionReadyRef.current = connection.start()

        connectionReadyRef.current
            .then(() => updateSignalRGroup())
            .catch(err => console.error('Erreur SignalR :', err))

        return () => {
            connection.off('ReceiveMessage')
            connection.off('MessagesRead')
            connection.off('UserTyping')
            connection.off('UserStoppedTyping')

            connectionRef.current = null
            joinedConversationIdRef.current = null
            connectionReadyRef.current = null

            connection.stop()
        }
    }, [])

    useEffect(() => {
        updateSignalRGroup()
    }, [selectedConversationId, selectedUserId])

    async function handleSendMessage(newMessage: string) {
        if (selectedConversationId === 0) {
            setError('Sélectionne un utilisateur qui possède une conversation.')
            return
        }

        setError('')
        setIsSending(true)

        try {
            const response = await fetch('http://localhost:5009/ChatMessages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: newMessage,
                    userId: selectedUserId,
                    conversationId: selectedConversationId
                })
            })

            if (!response.ok) {
                throw new Error(`Erreur API : ${response.status}`)
            }

            const result = await response.json()

            setMessages(previousMessages => {
                const messageId = String(result.id)

                const existingMessage = previousMessages.find(
                    message => message.id === messageId
                )

                const newMessageData: MessageData = {
                    id: messageId,
                    text: result.message,
                    translatedText: result.message,
                    translatedLanguage: users.find(
                        user => user.id === selectedUserId
                    )?.favouriteLanguage ?? '',
                    isMine: true,
                    isDelivered:
                        result.isDelivered ||
                        existingMessage?.isDelivered ||
                        readMessageIdsRef.current.has(messageId),

                    isRead:
                        result.isRead ||
                        existingMessage?.isRead ||
                        readMessageIdsRef.current.has(messageId),
                    sentAt: new Date(result.timestamp)
                }

                if (existingMessage) {
                    return previousMessages.map(message =>
                        message.id === messageId
                            ? { ...message, ...newMessageData }
                            : message
                    )
                }

                return [...previousMessages, newMessageData]
            })
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Erreur d'envoi."
            )
        } finally {
            setIsSending(false)
        }
    }

    function handleTyping() {
        console.log('Frappe détectée', connectionRef.current?.state, selectedConversationId)

        if (connectionRef.current?.state === 'Connected') {
            connectionRef.current.invoke(
                'Typing',
                selectedConversationId,
                users.find((user) => user.id === selectedUserId)?.name ?? ''
            ).catch((err) => console.error('Erreur de notification de saisie :', err))
        }
    }

    function handleStopTyping() {
        if (connectionRef.current?.state === 'Connected') {
            connectionRef.current.invoke(
                'StopTyping',
                selectedConversationId
            ).catch((err) =>
                console.error('Erreur d’arrêt de notification de saisie :', err)
            )
        }

        setTypingUser('')
    }

    return (
        <div className="chat-container">
            {/*<ChatHeader name={users.find(user => user.id === selectedUserId)?.name ?? 'Utilisateur'} />*/}
            <div className="chat-intro">
                <span className="chat-brand">LIVE TRANSLATE CHAT</span>
                <h1>
                    Bonjour {users.find(user => user.id === selectedUserId)?.name ?? 'Utilisateur'} 👋
                </h1>
                <p>Bienvenue dans votre espace de discussion.</p>
            </div>

            <h3 className="contacts-title">Mes conversations</h3>
            <div className="contact-list">
                {users
                    .filter(user => user.id !== selectedUserId)
                    .map(user => {
                        const conversation = conversations.find(
                            c =>
                                (c.firstUserId === selectedUserId && c.secondUserId === user.id) ||
                                (c.secondUserId === selectedUserId && c.firstUserId === user.id)
                        )

                        return (
                            <button
                                key={user.id}
                                className={`contact-avatar ${selectedConversationId === conversation?.id ? 'active' : ''}`}
                                onClick={async () => {
                                    if (conversation) {
                                        setSelectedConversationId(conversation.id)
                                        return
                                    }

                                    try {
                                        const response = await fetch('http://localhost:5009/Conversations', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                firstUserId: selectedUserId,
                                                secondUserId: user.id
                                            })
                                        })

                                        if (!response.ok) {
                                            throw new Error(`Erreur API : ${response.status}`)
                                        }

                                        const newConversation = await response.json()

                                        setConversations(previous => [...previous, newConversation])
                                        setSelectedConversationId(newConversation.id)
                                        setMessages([])
                                        setError('')
                                    } catch (err) {
                                        console.error('Erreur de création de conversation :', err)
                                        setError('Impossible de créer la conversation.')
                                    }
                                }}
                                title={user.name}
                            >
                                <span className="avatar-circle">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="language-flag">
                                    {user.favouriteLanguage === 'fr' ? '🇫🇷' :
                                        user.favouriteLanguage === 'en' ? '🇬🇧' :
                                            user.favouriteLanguage === 'es' ? '🇪🇸' :
                                                user.favouriteLanguage === 'de' ? '🇩🇪' :
                                                    user.favouriteLanguage === 'it' ? '🇮🇹' : '🌐'}
                                </span>
                                <span className="contact-name">{user.name}</span>
                            </button>
                        )
                    })}
            </div>
            {error && <p role="alert">{error}</p>}
            <MessageList
                messages={messages}
                isTyping={isTyping}
                typingUser={typingUser}
            />
            <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
            />
            {isSending && <p>Envoi et traduction en cours…</p>}
            <div className="chat-settings">
                <div className="profile-selector">
                    <label htmlFor="user-select">Profil de test :</label>
                    <select
                        id="user-select"
                        value={selectedUserId}
                        onChange={(e) => {
                            const userId = Number(e.target.value)
                            setSelectedUserId(userId)

                            const userConversations = conversations.filter(
                                (conversation) =>
                                    conversation.firstUserId === userId ||
                                    conversation.secondUserId === userId
                            )

                            setSelectedConversationId(
                                userConversations[0]?.id ?? 0
                            )
                        }}
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default App