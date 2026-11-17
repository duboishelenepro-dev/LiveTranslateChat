using Microsoft.AspNetCore.SignalR;
using LiveTranslateChat.Data;
using LiveTranslateChat.Entities;
using Microsoft.EntityFrameworkCore;

namespace LiveTranslateChat.Hubs;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task SendMessage(string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", message);
    }

    public async Task Typing(int conversationId, string userName)
    {
        await Clients.OthersInGroup($"conversation-{conversationId}").SendAsync(
            "UserTyping",
            conversationId,
            userName
        );
    }
    public async Task StopTyping(int conversationId)
    {
        await Clients.OthersInGroup($"conversation-{conversationId}").SendAsync(
            "UserStoppedTyping",
            conversationId
        );
    }
    public async Task JoinConversation(int conversationId, int userId)
    {
        Conversation? conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null ||
            (userId != conversation.FirstUserId &&
             userId != conversation.SecondUserId))
        {
            return;
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            $"conversation-{conversationId}"
        );
    }

    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            $"conversation-{conversationId}"
        );
    }
    public async Task MarkMessagesAsRead(int conversationId, int userId)
    {
        Conversation? conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null ||
            (userId != conversation.FirstUserId && userId != conversation.SecondUserId))
        {
            return;
        }

        List<ChatMessage> messages = await _context.ChatMessages
            .Where(m =>
                m.ConversationId == conversationId &&
                m.UserId != userId &&
                !m.IsRead)
            .ToListAsync();

        foreach (ChatMessage message in messages)
        {
            message.IsDelivered = true;
            message.IsRead = true;
        }

        await _context.SaveChangesAsync();

        await Clients.OthersInGroup($"conversation-{conversationId}")
            .SendAsync("MessagesRead", conversationId, userId,
                messages.Select(m => m.Id).ToList());
    }
}