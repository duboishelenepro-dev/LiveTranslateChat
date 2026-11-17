namespace LiveTranslateChat.Api.DTOs;

public class CreateConversationRequest
{
    public int FirstUserId { get; set; }
    public int SecondUserId { get; set; }
}