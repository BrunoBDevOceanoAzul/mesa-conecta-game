# Supabase Security & Database Sanitization Guide

## Overview

This document outlines the security configuration and sanitization procedures for the Supabase project `xqjiizwtfavpvxytqzvv`.

**Current Status**: ⚠️ Policies defined, pending deployment
- RLS policies: 6/6 core tables (defined in `20260504_sanitize_database.sql`)
- Test data: Sanitization script ready
- Credentials: Rotated and secured in GitHub secrets
- Migrations: Tracked via Drizzle ORM

---

## 1. Access Control Hierarchy

```
┌─────────────────────────────────────────┐
│        Row Level Security (RLS)         │
│  (User-specific data access rules)      │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│       Role-Based Access Control         │
│  (postgres, authenticated, anon, etc.)  │
└─────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────┐
│       Supabase Auth (JWT Tokens)        │
│  (Claims: uid, email, role, metadata)   │
└─────────────────────────────────────────┘
```

### Roles Defined

- **`postgres`**: Superuser (only on local dev)
- **`authenticated`**: Signed-in users (can access restricted data)
- **`anon`**: Anonymous/public users (limited access)
- **`service_role`**: Backend API (bypasses RLS - server-only)

---

## 2. RLS Policies by Table

### profiles
**Purpose**: User account data, preferences, public profiles

**Policies**:
```sql
-- READ: Own profile or public profiles
WHERE auth.uid() = user_id OR is_public = true

-- WRITE: Only own profile
WHERE auth.uid() = user_id
```

**Sensitive Columns**: `email`, `phone`, `user_agent`, `ip_hash`
- Grant SELECT to `authenticated` only
- Revoke SELECT from `anon` for sensitive columns

---

### mesas
**Purpose**: Table/session listings with participants

**Policies**:
```sql
-- READ: Own mesas or published mesas
WHERE user_id = auth.uid() OR status = 'published'

-- WRITE: Only own mesas
WHERE user_id = auth.uid()
```

---

### bookings
**Purpose**: Reservations and attendance records

**Policies**:
```sql
-- READ: Own bookings OR bookings for owned mesas
WHERE user_id = auth.uid() 
   OR mesa_id IN (SELECT id FROM mesas WHERE user_id = auth.uid())

-- WRITE: Own bookings only
WHERE user_id = auth.uid()
```

---

### posts
**Purpose**: Social feed content

**Policies**:
```sql
-- READ: Public posts or own posts
WHERE is_public = true OR user_id = auth.uid()

-- WRITE: Only own posts
WHERE user_id = auth.uid()
```

---

### reviews
**Purpose**: Player/GM ratings and feedback

**Policies**:
```sql
-- READ: Own reviews or public reviews
WHERE reviewer_id = auth.uid() OR is_public = true

-- WRITE: Only own reviews
WHERE reviewer_id = auth.uid()
```

---

## 3. Authentication Security Checklist

### ✅ DO:
- [ ] Use `app_metadata` for authorization (not `user_metadata`)
- [ ] Keep JWT expiry SHORT for sensitive operations (5-15 min)
- [ ] Validate `session_id` on critical operations (deletes, payments)
- [ ] Store service_role key ONLY in backend env vars
- [ ] Use `NEXT_PUBLIC_` prefix ONLY for publishable keys in frontend

### ❌ DON'T:
- [ ] Never trust `user_metadata` for authorization (user-editable)
- [ ] Never expose service_role key in frontend code
- [ ] Never use bare JWT without session validation
- [ ] Never log sensitive claims (email, phone in logs)

---

## 4. API Key Management

### Keys Location

**Frontend (.env.local)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xqjiizwtfavpvxytqzvv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Su1aBS5317eyJB5xnpjuPg_TwxkswXr
```
- ✅ Safe to commit (anonymously scoped)
- Used by supabase-js client in browser

**Backend (.env - NOT committed)**:
```
DATABASE_URL=postgresql://postgres:***@xqjiizwtfavpvxytqzvv.pooler.supabase.com:6543/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- ❌ NEVER commit to repo
- Stored only in GitHub Secrets + .gitignore
- Rotated every 90 days

---

## 5. Data Sanitization Procedures

### Phase 1: Identify Test Data
```bash
# Connect to Supabase and list test profiles
supabase db query --query "
  SELECT id, email, created_at 
  FROM profiles 
  WHERE email ILIKE '%test%' 
     OR email ILIKE '%demo%'
  ORDER BY created_at DESC
"
```

### Phase 2: Run Cleanup Migration
```bash
# Review the migration first
cat supabase/migrations/20260504_sanitize_database.sql

# Execute in dev environment
supabase migration up

# Verify results
supabase db query --query "SELECT COUNT(*) as profile_count FROM profiles"
```

### Phase 3: Verify Integrity
```bash
# Check foreign key constraints
supabase db advisors

# Run test suite
npm test
```

### Phase 4: Rotate Credentials (if data breach)
```bash
# Reset ALL Anon + Service Role keys in Supabase dashboard
# Then update in GitHub Secrets
# Redeploy all services
```

---

## 6. Storage Security

### Bucket Rules

**avatars** (public read, authenticated write):
```json
{
  "version": "1",
  "public": [
    {
      "resources": ["*"],
      "operations": ["retrieve"],
      "allow": true
    }
  ],
  "authenticated": [
    {
      "resources": ["${uid}/*"],
      "operations": ["insert", "update", "delete"],
      "allow": true
    }
  ]
}
```

**private-documents** (authenticated only):
```json
{
  "authenticated": [
    {
      "resources": ["${uid}/*"],
      "operations": ["retrieve", "insert", "update", "delete"],
      "allow": true
    }
  ]
}
```

### Upload Security
- ✅ File size limits: 10MB per file
- ✅ MIME type validation on upload
- ✅ Rename files with UUID to prevent path traversal
- ✅ Use signed URLs for private file access (1-hour expiry)

---

## 7. Compliance & Audit

### Audit Trail
Enable Postgres audit logging:
```sql
CREATE EXTENSION pgaudit;

CREATE AUDIT.audit (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT,
  operation TEXT,
  user_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER audit_insert AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE audit_insert();
```

### GDPR Right to be Forgotten
```sql
-- Cascading delete of user data (be careful!)
DELETE FROM profiles WHERE id = $1;
-- Triggers should cascade to: bookings, posts, reviews, etc.
```

---

## 8. Monitoring & Alerting

### Key Metrics to Monitor
- [ ] Failed login attempts (brute force detection)
- [ ] Unusual data access patterns (unusual RLS bypasses)
- [ ] Storage quota usage (prevent runaway files)
- [ ] Real-time connection count (DDOS mitigation)
- [ ] Slow query logs (performance + security)

### Set Up Alerts
```bash
# Via Supabase dashboard:
# Settings > Monitoring > Create Alert
# - Failed Auth: > 5 in 5 min
# - Slow Queries: > 10s
# - Database Connections: > 80% of limit
```

---

## 9. Disaster Recovery

### Backup Strategy
- ✅ Daily automated backups (Supabase handles)
- ✅ Weekly manual export to S3 (for archival)
- ✅ Point-in-time recovery: 7 days (Supabase Pro)

### Restore Procedure
```bash
# If disaster strikes:
1. Contact Supabase support for point-in-time restore
2. OR: Restore from last known-good backup
3. Re-run migrations for schema alignment
4. Verify data integrity with advisors
5. Rotate all auth keys as precaution
```

### Migration Rollback
```bash
# If migration breaks prod:
supabase migration down

# OR: Create reverse migration
supabase migration new revert_sanitize_database
# Edit the file with ROLLBACK SQL
supabase migration up
```

---

## 10. Secrets Rotation Schedule

| Secret | Last Rotated | Next Rotation | Procedure |
|--------|-------------|---------------|-----------|
| Anon Key | 2026-05-04 | 2026-08-04 | Reset in dashboard, update .env + GitHub Secrets |
| Service Role | 2026-05-04 | 2026-08-04 | Same as above |
| API Keys (Asaas, SendGrid) | - | Every 90 days | Update in GitHub Secrets |

---

## 11. Emergency Contacts

- **Supabase Support**: https://supabase.com/dashboard/support
- **Security Issue**: security@supabase.com
- **GitHub Security Advisory**: https://github.com/advisories

---

## Reference

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres Security](https://www.postgresql.org/docs/current/sql-grant.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
