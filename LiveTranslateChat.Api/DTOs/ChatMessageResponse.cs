namespace LiveTranslateChat.Api.DTOs;

public class ChatMessageResponse
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public string TranslatedText { get; set; } = string.Empty;
    public string TranslatedLanguage { get; set; } = string.Empty;
    public bool IsDelivered { get; set; }
    public bool IsRead { get; set; }
    public DateTime Timestamp { get; set; }
    public int UserId { get; set; }
    public int ConversationId { get; set; }
}