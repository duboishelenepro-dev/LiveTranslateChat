
type ChatHeaderProps = {
    name: string
}

function ChatHeader({ name }: ChatHeaderProps) {
    return (
        <div className="chat-header">
            <div className="avatar">
                {name.charAt(0).toUpperCase()}
            </div>

            <div className="contact-info">
                <h2>{name}</h2>
                <p className="contact-status">
                    <span className="status-dot"></span>
                    En ligne
                </p>
            </div>
        </div>
    )
}

export default ChatHeader
