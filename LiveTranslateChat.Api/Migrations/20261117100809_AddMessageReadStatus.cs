using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LiveTranslateChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageReadStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDelivered",
                table: "ChatMessages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRead",
                table: "ChatMessages",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDelivered",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "IsRead",
                table: "ChatMessages");
        }
    }
}
