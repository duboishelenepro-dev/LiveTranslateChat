namespace LiveTranslateChat.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FavouriteLanguage { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<ChatMessage> Messages { get; set; } = new();
}