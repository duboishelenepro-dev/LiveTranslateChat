import { useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'

type MessageInputProps = {
    onSendMessage: (newMessage: string) => void
    onTyping: () => void
    onStopTyping: () => void
}

function MessageInput({ onSendMessage, onTyping, onStopTyping }: MessageInputProps)
{
    const [message, setMessage] = useState("")
    const typingTimeout = useRef<number | undefined>(undefined)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    function handleSendMessage() {
        if (message.trim() !== "") {
            onSendMessage(message.trim())
            setMessage("")
            onStopTyping()
        } 
    }

    return (
        <div className="message-input-container">
            <div className="message-field">
                <input
                    placeholder="Ecrire un message..."
                    value={message}
                    maxLength={1000}
                    onChange={(event) => {
                        setMessage(event.target.value)
                        onTyping()

                        window.clearTimeout(typingTimeout.current)

                        typingTimeout.current = window.setTimeout(() => {
                            onStopTyping()
                        }, 2000)
                    }}
                    onBlur={onStopTyping}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSendMessage()
                        }
                    }}
                />

                <p className="character-count">
                    {1000 - message.length} caracteres restants
                </p>
            </div>
            <div className="emoji-container">
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Choisir un emoji"
                >
                    😊
                </button>

                {showEmojiPicker && (
                    <div className="emoji-picker-popup">
                        <EmojiPicker
                            onEmojiClick={(emojiData) => {
                                setMessage((previous) => previous + emojiData.emoji)
                            }}
                            height={400}
                            width="100%"
                        />
                    </div>
                )}
            </div>
            <button
                onClick={handleSendMessage}
                disabled={message.trim() === ""}
            >
                Envoyer
            </button>
        </div>
    )
}

export default MessageInput