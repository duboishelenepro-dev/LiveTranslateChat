using Microsoft.AspNetCore.Mvc;
using LiveTranslateChat.Entities;
using LiveTranslateChat.Data;
using System.Linq;
using LiveTranslateChat.Api.DTOs;

namespace LiveTranslateChat.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public ConversationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public List<ConversationResponse> GetConversations()
    {
        return _context.Conversations
            .Select(conversationResponse => new ConversationResponse
            {
                FirstUserId=conversationResponse.FirstUserId,
                SecondUserId=conversationResponse.SecondUserId,
                Id = conversationResponse.Id,
                CreatedAt = conversationResponse.CreatedAt
            })
            .ToList();
    }

    [HttpPost]
    public ActionResult<ConversationResponse> CreateConversations(CreateConversationRequest request)
    {
        if(request.FirstUserId == request.SecondUserId)
        {
            return BadRequest("Impossible");
        }

        User? firstUser = _context.Users.FirstOrDefault(u => u.Id == request.FirstUserId);
        User? secondUser = _context.Users.FirstOrDefault(u => u.Id == request.SecondUserId);

        if (firstUser == null || secondUser == null)
        {
            return NotFound("Un ou plusieurs utilisateurs n'existent pas.");
        }

        Conversation? existingConversation = _context.Conversations.FirstOrDefault(c =>
        (c.FirstUserId == request.FirstUserId && c.SecondUserId == request.SecondUserId)
        ||
        (c.FirstUserId == request.SecondUserId && c.SecondUserId == request.FirstUserId));

        if (existingConversation != null)
        {
            return BadRequest("Une conversation existe déjà entre ces deux utilisateurs.");
        }

        Conversation conversation = new Conversation
        {
            FirstUserId = request.FirstUserId,
            SecondUserId = request.SecondUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Conversations.Add(conversation);
        _context.SaveChanges();

        ConversationResponse conversationResponse = new ConversationResponse
        {
            Id = conversation.Id,
            CreatedAt = conversation.CreatedAt,
            FirstUserId = conversation.FirstUserId,
            SecondUserId = conversation.SecondUserId
        };

        return conversationResponse;
    }
}