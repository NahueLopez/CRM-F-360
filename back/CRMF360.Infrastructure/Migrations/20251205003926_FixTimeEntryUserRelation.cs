using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMF360.Infrastructure.Migrations
{
    public partial class FixTimeEntryUserRelation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Dropeamos la columna vieja (uuid)
            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "TimeEntries");

            // 2) Creamos la columna nueva como int
            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "TimeEntries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // 3) Índice sobre UsuarioId
            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UsuarioId",
                table: "TimeEntries",
                column: "UsuarioId");

            // 4) FK a Users.Id
            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Users_UsuarioId",
                table: "TimeEntries",
                column: "UsuarioId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revertimos los pasos en orden inverso

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Users_UsuarioId",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_UsuarioId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "TimeEntries");

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "TimeEntries",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);
        }
    }
}
