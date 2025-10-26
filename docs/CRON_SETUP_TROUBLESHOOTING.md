# CRON Setup Troubleshooting Guide

This guide helps you diagnose and fix issues with CRON job scheduling in Hookified.

## Quick Diagnosis

If you're getting an error when creating a CRON hook, visit the admin endpoint to check your setup:

```
GET /api/admin/cron-setup
```

This endpoint returns detailed diagnostics about your CRON setup.

## Common Issues and Solutions

### 1. "exec_sql function not found"

**Symptoms:**
- Error message: "CRON scheduling unavailable: exec_sql function not found"
- Error when creating CRON hooks

**Solution:**
The `exec_sql` function is required to create pg_cron jobs. You need to run the setup SQL:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-cron-jobs-setup.sql`
4. Run the SQL script

The setup script will:
- Create the `exec_sql` function
- Grant necessary permissions
- Enable required extensions

### 2. "pg_cron extension not enabled"

**Symptoms:**
- Error message: "CRON scheduling unavailable: pg_cron extension not enabled"

**Solution:**
1. Open your Supabase dashboard
2. Go to Database → Extensions
3. Find "pg_cron" in the list
4. Click "Enable" or toggle it on

Alternatively, run this SQL:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 3. "http extension not enabled"

**Symptoms:**
- Error message: "CRON scheduling unavailable: http extension not enabled"

**Solution:**
The `http` extension is required for making HTTP requests from cron jobs.

1. Open your Supabase dashboard
2. Go to Database → Extensions
3. Find "http" in the list
4. Click "Enable" or toggle it on

Alternatively, run this SQL:
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

### 4. "insufficient permissions"

**Symptoms:**
- Error message: "CRON scheduling unavailable: insufficient permissions"

**Solution:**
Your service role doesn't have the necessary permissions to use pg_cron.

Run this SQL to grant permissions:
```sql
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cron TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO service_role;
```

### 5. "CRON_SECRET not set"

**Symptoms:**
- Hook creation fails
- Setup validator reports missing environment variable

**Solution:**
Add the `CRON_SECRET` to your environment variables:

```bash
CRON_SECRET="your-secure-random-string-here"
```

Generate a secure random string:
```bash
openssl rand -hex 32
```

Make sure this matches in both your `.env.local` file and your hosting platform's environment variables.

### 6. "SUPABASE_SERVICE_ROLE_KEY not set"

**Symptoms:**
- Setup validator reports missing service role key
- Cannot create cron jobs

**Solution:**
1. Open your Supabase dashboard
2. Go to Settings → API
3. Copy the "service_role" secret key
4. Add it to your environment variables:

```bash
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

⚠️ **Warning:** Never commit this key to version control. It has full access to your database.

## Setup Verification

### Using the Admin Endpoint

Visit `GET /api/admin/cron-setup` to get a detailed report of your setup.

Example response:
```json
{
  "success": true,
  "setup": {
    "isSetup": true,
    "isValid": true,
    "issues": [],
    "details": {
      "environmentVariables": { ... },
      "databaseExtensions": { ... },
      "functions": { ... },
      "permissions": true
    }
  }
}
```

### Manual Verification

Run these SQL queries in your Supabase SQL Editor to verify setup:

```sql
-- Check if exec_sql function exists
SELECT proname FROM pg_proc WHERE proname = 'exec_sql';

-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check if http extension is enabled
SELECT * FROM pg_extension WHERE extname = 'http';

-- List all cron jobs
SELECT * FROM cron.job;
```

## Complete Setup Checklist

Use this checklist to ensure everything is configured correctly:

- [ ] `pg_cron` extension is enabled
- [ ] `http` extension is enabled
- [ ] `exec_sql` function exists and is accessible
- [ ] Service role has permissions on `cron` and `http` schemas
- [ ] `CRON_SECRET` environment variable is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
- [ ] `NEXT_PUBLIC_SUPABASE_URL` environment variable is set
- [ ] Running the setup SQL script completed successfully

## Testing Your Setup

Once setup is complete, test it by creating a simple CRON hook:

1. Create a hook with trigger type "CRON"
2. Set schedule to run every minute: `* * * * *`
3. Save the hook

If successful, you should see a log message:
```
✅ Created cron job 'hook_<hook-id>' with schedule '* * * * *'
```

You can also verify the job was created in Supabase:
```sql
SELECT * FROM cron.job WHERE jobname LIKE 'hook_%';
```

## Getting Help

If you're still experiencing issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Run the setup verification endpoint
4. Check the Supabase logs for database errors
5. Ensure you're using the latest version of the setup SQL script

## Additional Resources

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Hookified CRON System Documentation](docs/CRON_SCHEDULING_SYSTEM.md)
- [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md)
