namespace LiveTranslateChat.Api.DTOs;

public class ConversationResponse
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public int FirstUserId { get; set; }
    public int SecondUserId { get; set; }
}