using Microsoft.EntityFrameworkCore;
using LiveTranslateChat.Entities;

namespace LiveTranslateChat.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base (options)
    {

    }

    public DbSet<User> Users { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
}

