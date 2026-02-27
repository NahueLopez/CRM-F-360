CREATE TABLE IF NOT EXISTS "Rooms" (
    "Id" SERIAL PRIMARY KEY,
    "TenantId" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Location" TEXT,
    "Capacity" INTEGER NOT NULL DEFAULT 1,
    "Amenities" TEXT,
    "Description" TEXT,
    "Color" TEXT,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DeletedAt" TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS "RoomReservations" (
    "Id" SERIAL PRIMARY KEY,
    "TenantId" INTEGER NOT NULL,
    "RoomId" INTEGER NOT NULL REFERENCES "Rooms"("Id") ON DELETE CASCADE,
    "UserId" INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Title" TEXT NOT NULL,
    "StartTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "EndTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_RoomReservations_RoomId" ON "RoomReservations" ("RoomId");
CREATE INDEX IF NOT EXISTS "IX_RoomReservations_UserId" ON "RoomReservations" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Rooms_TenantId" ON "Rooms" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_RoomReservations_TenantId" ON "RoomReservations" ("TenantId");
