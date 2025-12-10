using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMF360.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class @fixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "HorasEstimadasMensuales",
                table: "Proyectos",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HorasEstimadasTotales",
                table: "Proyectos",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HorasEstimadasMensuales",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "HorasEstimadasTotales",
                table: "Proyectos");
        }
    }
}
