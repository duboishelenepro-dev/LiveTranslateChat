
import { useEffect, useRef } from 'react'
import type { MessageData } from './types'

type MessageListProps = {
    messages: MessageData[]
    isTyping: boolean
    typingUser: string
}

function MessageList({ messages, isTyping, typingUser }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    return (
        <div className="message-list">
            {messages.length > 0 && (
                <div className="date-separator">
                    {new Date().toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </div>
            )}

            {messages.length === 0 && (
                <p className="empty-chat">
                    Aucun message pour le moment. Envoie le premier !
                </p>
            )}

            {messages.map((message) => (
                <div
                    className={message.isMine ? 'message-bubble mine' : 'message-bubble'}
                    key={message.id}
                >
                    <p>{message.translatedText || message.text}</p>

                    {!message.isMine && message.translatedText && (
                        <div className="translated-text">
                            <p>{message.text}</p>
                            <small>Message original</small>
                        </div>
                    )}

                    <div className="message-footer">
                        <span className="message-date">
                            {message.sentAt.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>

                        {message.isMine && (
                            <span className="message-status">
                                {message.isRead
                                    ? '✓✓ Lu'
                                    : message.isDelivered
                                        ? '✓✓ Reçu'
                                        : '✓ Envoyé'}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="typing-message">
                    <span className="typing-name">{typingUser}</span>
                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}

export default MessageList
