
export type MessageData = {
    text: string
    isMine: boolean
    sentAt: Date
    id: string

    originalLanguage?: string
    translatedText?: string
    translatedLanguage?: string

    isDelivered?: boolean
    isRead?: boolean
}
