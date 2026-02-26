-- ═══════════════════════════════════════════════════════════
-- PostgreSQL Row Level Security (RLS) for Multi-Tenant CRM
-- Defense-in-depth: even if app-level filters fail,
-- the database enforces tenant isolation.
-- ═══════════════════════════════════════════════════════════

-- IMPORTANT: Run this migration AFTER the app sets
-- SET LOCAL app.current_tenant_id = '<id>' on each request.

-- ── Enable RLS on tenant-scoped tables ──

ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deals"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Leads"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Users"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLogs"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLogs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notifications"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminders"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatConversations" ENABLE ROW LEVEL SECURITY;

-- ── Create policies ──
-- Each policy checks TenantId against the session variable

CREATE POLICY tenant_isolation ON "Companies"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "Deals"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "Leads"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "Users"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "ActivityLogs"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "AuditLogs"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "Notifications"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "Reminders"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation ON "ChatConversations"
  USING ("TenantId" = current_setting('app.current_tenant_id', true)::int);

-- ── Force RLS for the app user (not superuser) ──
-- NOTE: Replace 'crm_app' with your actual database user
-- ALTER TABLE "Companies" FORCE ROW LEVEL SECURITY;
-- Repeat for each table above.
