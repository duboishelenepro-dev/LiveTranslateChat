namespace LiveTranslateChat.Api.DTOs;

public class CreateChatMessageRequest
{
    public string Message { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int ConversationId { get; set; }
}