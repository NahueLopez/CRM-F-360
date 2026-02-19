using Npgsql;

var connStr = "Host=localhost;Port=5432;Database=crm_f360;Username=postgres;Password=qweasdzxc";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();

await using var cmd = conn.CreateCommand();
cmd.CommandText = """
    DELETE FROM "UserRoles" WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Email"='admin@crm-f360.test');
    DELETE FROM "Users" WHERE "Email"='admin@crm-f360.test';
    """;
var rows = await cmd.ExecuteNonQueryAsync();
Console.WriteLine($"Deleted {rows} rows. Restart the backend to re-seed.");
