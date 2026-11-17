namespace LiveTranslateChat.Entities;

public class ChatMessage
{
    public string Message { get; set; } = string.Empty;
    public string OriginalLanguage { get; set; } = string.Empty;
    public string TranslatedText { get; set; } = string.Empty;
    public int Id { get; set; }
    public bool IsDelivered { get; set; } = false;
    public bool IsRead { get; set; } = false;
    public DateTime Timestamp { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ConversationId {get; set;}
    public Conversation Conversation { get; set; } = null!;
}
