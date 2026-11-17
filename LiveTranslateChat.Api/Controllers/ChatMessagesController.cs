using Microsoft.AspNetCore.Mvc;
using LiveTranslateChat.Entities;
using LiveTranslateChat.Data;
using LiveTranslateChat.Services;
using System.Linq;
using LiveTranslateChat.Api.DTOs;
using Microsoft.AspNetCore.SignalR;
using LiveTranslateChat.Hubs;

namespace LiveTranslateChat.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ChatMessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly TranslationService _translationService;
    private readonly IHubContext<ChatHub> _hubContext;
    public ChatMessagesController(
    ApplicationDbContext context,
    TranslationService translationService,
    IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _translationService = translationService;
        _hubContext = hubContext;
    }


    [HttpGet]
    public async Task<ActionResult<List<ChatMessageResponse>>> GetChatMessages(
        [FromQuery] int userId,
        [FromQuery] int conversationId)
    {
        User? currentUser = _context.Users.FirstOrDefault(u => u.Id == userId);

        if (currentUser == null)
        {
            return NotFound("Utilisateur introuvable.");
        }

        Conversation? conversation = _context.Conversations
            .FirstOrDefault(c => c.Id == conversationId);

        if (conversation == null)
        {
            return NotFound("Conversation introuvable.");
        }

        if (userId != conversation.FirstUserId &&
            userId != conversation.SecondUserId)
        {
            return Forbid();
        }

        List<ChatMessage> messages = _context.ChatMessages
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.Timestamp)
            .ToList();

        List<ChatMessageResponse> responses = new();

        foreach (ChatMessage message in messages)
        {
            string translatedText = message.UserId == userId
                ? message.Message
                : message.TranslatedText;

            responses.Add(new ChatMessageResponse
            {
                Id = message.Id,
                Message = message.Message,
                TranslatedText = translatedText,
                TranslatedLanguage = message.UserId == userId
                    ? currentUser.FavouriteLanguage
                    : currentUser.FavouriteLanguage,
                UserId = message.UserId,
                ConversationId = message.ConversationId,
                Timestamp = message.Timestamp,
                IsDelivered = message.IsDelivered,
                IsRead = message.IsRead
            });
        }

        return Ok(responses);
    }


    [HttpPost]
    public async Task<ActionResult<ChatMessageResponse>> CreateChatMessagesRequest(CreateChatMessageRequest request)
    {
        Conversation? conversation = _context.Conversations.FirstOrDefault(c => c.Id == request.ConversationId);

        if (conversation == null)
        {
            return NotFound();
        }

        if(request.UserId != conversation.FirstUserId && request.UserId != conversation.SecondUserId)
        {
            return BadRequest("User does not belong to this conversation.");
        }

        int otherUserId;

        if (request.UserId == conversation.FirstUserId) 
        {
            otherUserId = conversation.SecondUserId;
        }
        else
        {
            otherUserId = conversation.FirstUserId;
        }

        User? otherUser = _context.Users.FirstOrDefault(u => u.Id == otherUserId);

        if (otherUser == null)
        {
            return NotFound();
        }

        string translatedText = await _translationService.TranslateAsync(
            request.Message,
            otherUser.FavouriteLanguage
        );

        ChatMessage chatMessage = new ChatMessage
        {
            Message = request.Message,
            TranslatedText = translatedText,
            UserId = request.UserId,
            ConversationId = request.ConversationId,
            Timestamp = DateTime.UtcNow
        };
        _context.ChatMessages.Add(chatMessage);
        _context.SaveChanges();

        await _hubContext.Clients
            .Group($"conversation-{request.ConversationId}")
            .SendAsync("ReceiveMessage", request.ConversationId);

        ChatMessageResponse chatMessageResponse = new ChatMessageResponse
        {
            Message = chatMessage.Message,
            TranslatedText = chatMessage.TranslatedText,
            TranslatedLanguage = otherUser.FavouriteLanguage,
            UserId = chatMessage.UserId,
            ConversationId = chatMessage.ConversationId,
            Timestamp = chatMessage.Timestamp,
            Id = chatMessage.Id,
            IsDelivered = chatMessage.IsDelivered,
            IsRead = chatMessage.IsRead
        };
        return chatMessageResponse;
    }
}