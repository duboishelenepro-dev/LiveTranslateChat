namespace LiveTranslateChat.Entities;

public class Conversation
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public int FirstUserId { get; set; }
    public int SecondUserId { get; set; }
    public User FirstUser { get; set; } = null!;
    public User SecondUser { get; set; } = null!;
    public List<ChatMessage> Messages { get; set; } = new();
}