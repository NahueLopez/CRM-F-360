using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRMF360.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixEmpresaProyectoRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Proyectos_Empresas_EmpresaId1",
                table: "Proyectos");

            migrationBuilder.DropIndex(
                name: "IX_Proyectos_EmpresaId1",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "EmpresaId1",
                table: "Proyectos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpresaId1",
                table: "Proyectos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_EmpresaId1",
                table: "Proyectos",
                column: "EmpresaId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Proyectos_Empresas_EmpresaId1",
                table: "Proyectos",
                column: "EmpresaId1",
                principalTable: "Empresas",
                principalColumn: "Id");
        }
    }
}
