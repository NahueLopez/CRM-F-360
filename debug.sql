INSERT INTO "Companies" ("TenantId","Name","Active","CreatedAt","IsDeleted","RowVersion")
VALUES (1,'TestCompany',true,NOW(),false,0)
RETURNING "Id","Name";
