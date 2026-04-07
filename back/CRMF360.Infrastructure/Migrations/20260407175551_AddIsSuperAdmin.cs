using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMF360.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSuperAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Mark existing admin as SuperAdmin
            migrationBuilder.Sql(
                """UPDATE "Users" SET "IsSuperAdmin" = true WHERE "Email" = 'admin@crm-f360.test'""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSuperAdmin",
                table: "Users");
        }
    }
}
