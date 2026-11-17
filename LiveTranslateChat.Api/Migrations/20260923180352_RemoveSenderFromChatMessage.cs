using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveTranslateChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSenderFromChatMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sender",
                table: "ChatMessages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sender",
                table: "ChatMessages",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
