function Message({ text, translation }) {
    return (
        <div>
            <h2>{text}</h2>
            <h2>{translation}</h2>
        </div>
    )
}

export default Message