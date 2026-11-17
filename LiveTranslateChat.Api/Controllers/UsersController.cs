using Microsoft.AspNetCore.Mvc;
using LiveTranslateChat.Entities;
using LiveTranslateChat.Data;
using System.Linq;
using LiveTranslateChat.Api.DTOs;

namespace LiveTranslateChat.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public List<User> GetUsers()
    {
        return _context.Users.ToList();
    }

    [HttpPost]
    public User CreateUser(CreateUserRequest request)
    {
        User user = new User
        {
            Name = request.Name,
            Email = request.Email,
            FavouriteLanguage = request.FavouriteLanguage,
            CreatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        return user;
    }


    [HttpPut("{id}")]
    public ActionResult<User> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        User? user = _context.Users.FirstOrDefault(u => u.Id == id);

        if (user == null)
        {
            return NotFound();
        }

        user.Name = request.Name;
        user.Email = request.Email;
        user.FavouriteLanguage = request.FavouriteLanguage;
        _context.SaveChanges();

        return Ok(user);
    }

}