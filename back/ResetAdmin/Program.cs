using Npgsql;

// Connect to 'postgres' DB (not the target DB) to drop/recreate
var connStr = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=qweasdzxc";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();

// Terminate all connections to crm_f360_new
await using (var cmd1 = conn.CreateCommand())
{
    cmd1.CommandText = """
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = 'crm_f360_new' AND pid <> pg_backend_pid();
    """;
    await cmd1.ExecuteNonQueryAsync();
}

// Drop and recreate
await using (var cmd2 = conn.CreateCommand())
{
    cmd2.CommandText = "DROP DATABASE IF EXISTS crm_f360_new;";
    await cmd2.ExecuteNonQueryAsync();
    Console.WriteLine("✅ Database dropped");
}

await using (var cmd3 = conn.CreateCommand())
{
    cmd3.CommandText = "CREATE DATABASE crm_f360_new;";
    await cmd3.ExecuteNonQueryAsync();
    Console.WriteLine("✅ Database created fresh");
}

Console.WriteLine("Done! Start the backend to apply new schema via EnsureCreated + DataSeeder.");
